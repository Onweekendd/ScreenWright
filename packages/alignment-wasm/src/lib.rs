// 导入新模块
pub mod alignment;
pub mod bi;
pub mod rbush;
pub mod rbush_utils;
mod types;

// 重新导出公共类型和函数
pub use alignment::{
    AlignmentResult, BBoxWithMid, GraphShape, HorizontalLine, RefLineManager, VerticalLine,
};
pub use types::{Axis, BBox, HasBBox, RBush, RBushNode};
