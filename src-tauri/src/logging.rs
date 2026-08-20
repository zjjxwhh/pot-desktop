use log::LevelFilter;
use std::sync::atomic::{AtomicUsize, Ordering};

// 运行时日志级别
static RUNTIME_LEVEL: AtomicUsize = AtomicUsize::new(LevelFilter::Info as usize);

pub fn apply_log_level(level: &str) {
    let filter = match level {
        "error" => LevelFilter::Error,
        "warn" => LevelFilter::Warn,
        "info" => LevelFilter::Info,
        "debug" => LevelFilter::Debug,
        "trace" => LevelFilter::Trace,
        _ => LevelFilter::Info,
    };
    RUNTIME_LEVEL.store(filter as usize, Ordering::Relaxed);
    log::set_max_level(filter);
}

pub fn runtime_level() -> LevelFilter {
    match RUNTIME_LEVEL.load(Ordering::Relaxed) {
        0 => LevelFilter::Off,
        1 => LevelFilter::Error,
        2 => LevelFilter::Warn,
        3 => LevelFilter::Info,
        4 => LevelFilter::Debug,
        _ => LevelFilter::Trace,
    }
}
