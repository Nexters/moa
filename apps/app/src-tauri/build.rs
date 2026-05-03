fn main() {
    println!("cargo:rerun-if-env-changed=KAKAO_REST_API_KEY");
    println!("cargo:rerun-if-env-changed=KAKAO_CLIENT_SECRET");
    tauri_build::build()
}
