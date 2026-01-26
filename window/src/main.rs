// Launches a desktop window displaying embedded web content

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_embed::RustEmbed;
use std::borrow::Cow;
use std::env;
use tao::{
    dpi::LogicalSize,
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::{Icon, WindowBuilder},
};
use wry::{http, WebViewBuilder};

// Embed static files from the "dist" directory
#[derive(RustEmbed)]
#[folder = "dist/"]
struct Assets;

/// Load the embedded window icon from the assets directory.
fn load_window_icon() -> Option<Icon> {
    // Load raw icon bytes at compile time
    let bytes: &'static [u8] = include_bytes!("../assets/icon.ico");

    // Decode image data into an RGBA image
    match image::load_from_memory(bytes) {
        Ok(img) => {
            let rgba = img.into_rgba8();
            let (w, h) = rgba.dimensions();
            // Convert RGBA data into a window icon
            match Icon::from_rgba(rgba.into_raw(), w, h) {
                Ok(icon) => Some(icon),
                Err(e) => {
                    // Log conversion error
                    eprintln!("Error converting icon to tao::window::Icon: {}", e);
                    None
                }
            }
        }
        Err(e) => {
            // Log decoding error
            eprintln!("Failed to decode assets/icon.ico: {}", e);
            None
        }
    }
}

fn main() -> wry::Result<()> {
    // On Linux, force the Wayland backend if desired.
    // WINIT_UNIX_BACKEND can be "wayland" or "x11". If not set, winit will try Wayland and fall back to X11.
    // This must be set before creating the EventLoop (i.e. before winit/wry initializes the display backend).
    if cfg!(target_os = "linux") {
        env::set_var("WINIT_UNIX_BACKEND", "wayland");
    }

    // Initialize the event loop
    let event_loop = EventLoop::new();

    // Retrieve optional window icon
    let icon = load_window_icon();

    // Construct the application window with title, size, and icon
    let window = WindowBuilder::new()
        .with_title("Simulador de Memoria")
        .with_inner_size(LogicalSize::new(800.0, 600.0))
        .with_window_icon(icon)
        .build(&event_loop)
        .expect("failed to build window");

    // Create a WebView bound to the window (API actual: new() sin argumentos)
    let builder = WebViewBuilder::new();

    // Define custom protocol handler to serve embedded assets
    let _webview = builder
        .with_custom_protocol("mi-app".into(), move |_, request| {
            let path = request.uri().path();

            // Determine requested asset path
            let asset_path = if path == "/" {
                "index.html"
            } else {
                path.trim_start_matches('/')
            };

            // Serve the asset if found, otherwise return 404
            match Assets::get(asset_path) {
                Some(content_file) => {
                    let mime = mime_guess::from_path(asset_path).first_or_octet_stream();

                    // Build HTTP response with appropriate MIME type
                    http::Response::builder()
                        .status(200)
                        .header("Content-Type", mime.as_ref())
                        .header("Access-Control-Allow-Origin", "*")
                        .body(content_file.data)
                        .unwrap()
                }
                None => http::Response::builder()
                    .status(404)
                    .header("Content-Type", "text/plain")
                    .body(Cow::from("Archivo no encontrado".as_bytes().to_vec()))
                    .unwrap(),
            }
        })
        .with_url("mi-app://localhost/")
        .with_devtools(true)
        .build(&window)?;

    // Run the event loop handling window events
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {
                println!("Aplicación iniciada");
            }
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            _ => (),
        }
    });
}
