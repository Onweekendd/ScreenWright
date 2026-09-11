use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use tauri::Manager;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

/// 持有 funAI 后端子进程句柄，App 退出时 kill。
struct Backend(Mutex<Option<CommandChild>>);

const BACKEND_PORT: u16 = 4111;
const READY_TIMEOUT: Duration = Duration::from_secs(120);
/// 前端首屏第一个要命的接口，返回 200 才算「真就绪」（TCP 通了不代表路由已挂载）
const READY_PROBE_PATH: &str = "/user/roleEquities/infoByApplicationCode/BI";

static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

/// 打包版没有控制台，日志写到 <appDataDir>/desktop.log
fn log(msg: impl AsRef<str>) {
    let line = format!("[{}] {}\n", chrono_now(), msg.as_ref());
    if let Some(p) = LOG_PATH.get() {
        if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(p) {
            let _ = f.write_all(line.as_bytes());
        }
    }
    print!("{line}");
}

fn chrono_now() -> String {
    let d = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    format!("{}", d.as_secs())
}

/// 去掉 Windows 的 \\?\ / \\?\UNC\ 扩展长度前缀（resource_dir()/app_data_dir() 会带）
fn strip_verbatim(p: PathBuf) -> PathBuf {
    let s = p.to_string_lossy().into_owned();
    if let Some(rest) = s.strip_prefix(r"\\?\UNC\") {
        PathBuf::from(format!(r"\\{rest}"))
    } else if let Some(rest) = s.strip_prefix(r"\\?\") {
        PathBuf::from(rest)
    } else {
        p
    }
}

/// libsql/prisma 的 file: URL 需要正斜杠（file:C:/x）
fn fwd(p: &Path) -> String {
    strip_verbatim(p.to_path_buf()).to_string_lossy().replace('\\', "/")
}

/// dev：仓库布局 servers/server；prod：resource_dir()/server
fn server_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    if let Ok(dir) = std::env::var("SCREENWRIGHT_SERVER_DIR") {
        return Some(PathBuf::from(dir));
    }
    if tauri::is_dev() {
        let repo_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).ancestors().nth(3)?.to_path_buf();
        Some(repo_root.join("servers").join("server"))
    } else {
        Some(strip_verbatim(app.path().resource_dir().ok()?).join("server"))
    }
}

/// 递归拷贝目录（dst 已存在的文件会被覆盖）
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_all(&from, &to)?;
        } else {
            std::fs::copy(&from, &to)?;
        }
    }
    Ok(())
}

/// prod 首启：把内置的预 seed .db 拷到 appDataDir（若尚不存在），返回该目录
fn ensure_data(app: &tauri::AppHandle, server: &Path) -> Option<PathBuf> {
    let data_dir = strip_verbatim(app.path().app_data_dir().ok()?);
    std::fs::create_dir_all(&data_dir).ok()?;
    for db in ["screenwright.db", "mastra.db"] {
        let dst = data_dir.join(db);
        let seed = server.join("data").join(db);
        if !dst.exists() && seed.exists() {
            match std::fs::copy(&seed, &dst) {
                Ok(n) => log(format!("seed {db} -> appData ({n} bytes)")),
                Err(e) => log(format!("seed {db} 失败: {e}")),
            }
        }
    }

    // agent-workspace 基础设施：skills / scripts / types / tsconfig.json。
    // 逐条按「目标不存在才播种」——不覆盖用户/运行时可能已改动的内容，
    // 也不碰 screen_* 与 artifact-app 等运行时目录。
    let ws_dst = data_dir.join("agent-workspace");
    let ws_seed = server.join("agent-workspace");
    for entry in ["skills", "scripts", "types", "tsconfig.json"] {
        let from = ws_seed.join(entry);
        let to = ws_dst.join(entry);
        if to.exists() || !from.exists() {
            continue;
        }
        let res = if from.is_dir() {
            copy_dir_all(&from, &to)
        } else {
            std::fs::create_dir_all(&ws_dst).and_then(|_| std::fs::copy(&from, &to).map(|_| ()))
        };
        match res {
            Ok(()) => log(format!("seed agent-workspace/{entry} -> appData")),
            Err(e) => log(format!("seed agent-workspace/{entry} 失败: {e}")),
        }
    }

    Some(data_dir)
}

fn spawn_backend(app: &tauri::AppHandle) -> Option<CommandChild> {
    let dir = server_dir(app)?;
    log(format!("server_dir = {}", dir.display()));
    let entry = dir.join("dist").join("server.mjs");
    if !entry.exists() {
        log(format!("后端入口不存在: {}", entry.display()));
        return None;
    }

    let mut cmd = if tauri::is_dev() {
        app.shell().command("node")
    } else {
        match app.shell().sidecar("node") {
            Ok(c) => c,
            Err(e) => {
                log(format!("sidecar(\"node\") 解析失败: {e}"));
                return None;
            }
        }
    };

    // 传原生路径（反斜杠），node 在 Windows 上都认，避免 fwd 后 realpath 出岔
    cmd = cmd.current_dir(&dir).arg(entry.to_string_lossy().into_owned()).env("DEV_PORT", BACKEND_PORT.to_string());

    if !tauri::is_dev() {
        if let Some(data_dir) = ensure_data(app, &dir) {
            cmd = cmd
                .env("PRISMA_DATABASE_URL", format!("file:{}", fwd(&data_dir.join("screenwright.db"))))
                .env("MASTRA_DATABASE_URL", format!("file:{}", fwd(&data_dir.join("mastra.db"))))
                .env("BLOB_STORAGE_DIR", fwd(&data_dir.join("blob")))
                .env("MASTRA_WORKSPACE_PATH", fwd(&data_dir.join("agent-workspace")));
        }
    }

    match cmd.spawn() {
        Ok((mut rx, child)) => {
            log(format!("后端已 spawn: node {}", entry.display()));
            tauri::async_runtime::spawn(async move {
                while let Some(ev) = rx.recv().await {
                    match ev {
                        CommandEvent::Stdout(b) => log(format!("[out] {}", String::from_utf8_lossy(&b).trim_end())),
                        CommandEvent::Stderr(b) => log(format!("[err] {}", String::from_utf8_lossy(&b).trim_end())),
                        CommandEvent::Error(e) => log(format!("[proc-error] {e}")),
                        CommandEvent::Terminated(p) => {
                            log(format!("后端退出 code={:?} signal={:?}", p.code, p.signal));
                            break;
                        }
                        _ => {}
                    }
                }
            });
            Some(child)
        }
        Err(e) => {
            log(format!("spawn 失败: {e}"));
            None
        }
    }
}

/// 发一个裸 HTTP/1.0 GET，返回状态码；连不上 / 超时返回 None
fn http_probe(addr: &std::net::SocketAddr, path: &str) -> Option<u16> {
    use std::io::Read;
    let mut stream = std::net::TcpStream::connect_timeout(addr, Duration::from_millis(800)).ok()?;
    stream.set_read_timeout(Some(Duration::from_secs(3))).ok()?;
    stream.set_write_timeout(Some(Duration::from_secs(3))).ok()?;
    let req = format!("GET {path} HTTP/1.0\r\nHost: 127.0.0.1:{BACKEND_PORT}\r\nConnection: close\r\n\r\n");
    stream.write_all(req.as_bytes()).ok()?;
    let mut buf = [0u8; 128];
    let n = stream.read(&mut buf).ok()?;
    let head = String::from_utf8_lossy(&buf[..n]);
    // "HTTP/1.1 200 OK"
    head.split_whitespace().nth(1)?.parse().ok()
}

fn wait_backend_ready() {
    let addr: std::net::SocketAddr = format!("127.0.0.1:{BACKEND_PORT}").parse().unwrap();
    let start = Instant::now();
    while start.elapsed() < READY_TIMEOUT {
        if let Some(code) = http_probe(&addr, READY_PROBE_PATH) {
            if code == 200 {
                log(format!("后端就绪（HTTP {code}），耗时 {:?}", start.elapsed()));
                return;
            }
            log(format!("后端在预热（HTTP {code}），已等 {:?}", start.elapsed()));
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    log(format!("等待后端超时（{READY_TIMEOUT:?}），仍打开窗口"));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Ok(d) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&d);
                let _ = LOG_PATH.set(d.join("desktop.log"));
            }
            log(format!("=== 启动  is_dev={} ===", tauri::is_dev()));

            let handle = app.handle().clone();
            app.manage(Backend(Mutex::new(spawn_backend(&handle))));

            std::thread::spawn(move || {
                wait_backend_ready();
                if let Some(w) = handle.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("运行 Screenwright 桌面端时出错")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app.try_state::<Backend>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
