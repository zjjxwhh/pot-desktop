# pnpm install --resolution-only
pnpm install
sed -i "s/#openssl/openssl={version=\"0.10\",features=[\"vendored\"]}/g" src-tauri/Cargo.toml
if [ "$INPUT_TARGET" = "x86_64-unknown-linux-gnu" ]; then
    pnpm tauri build --target $INPUT_TARGET
else
    # Non-x86_64 targets build deb/rpm only (no AppImage). The v1-compatible Linux
    # updater artifact requires an AppImage, so disable updater artifacts to avoid
    # "Unable to find a bundled project for the updater".
    pnpm tauri build --target $INPUT_TARGET -b deb rpm --config '{"bundle":{"createUpdaterArtifacts":false}}'
fi
