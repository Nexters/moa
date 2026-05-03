fn main() {
    println!("cargo:rerun-if-env-changed=KAKAO_REST_API_KEY");
    println!("cargo:rerun-if-env-changed=KAKAO_CLIENT_SECRET");
    println!("cargo:rerun-if-env-changed=APPLE_TEAM_ID");
    println!("cargo:rerun-if-env-changed=APPLE_CLIENT_ID");
    println!("cargo:rerun-if-env-changed=APPLE_KEY_ID");
    println!("cargo:rerun-if-env-changed=APPLE_PRIVATE_KEY");
    tauri_build::build()
}
