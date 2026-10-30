-- 大屏访问密码功能已下线，代码不再读写这两列
-- AlterTable
ALTER TABLE "large_screen" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "large_screen_version" DROP COLUMN "password";
