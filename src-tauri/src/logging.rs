use log::LevelFilter;

pub fn apply_log_level(level: &str) {
    let filter = match level {
        "error" => LevelFilter::Error,
        "warn" => LevelFilter::Warn,
        "info" => LevelFilter::Info,
        "debug" => LevelFilter::Debug,
        "trace" => LevelFilter::Trace,
        _ => LevelFilter::Info,
    };
    log::set_max_level(filter);
}
