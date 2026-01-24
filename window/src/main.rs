// Launches a desktop window displaying embedded web content

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_embed::RustEmbed;
use std::borrow::Cow;
use tao::{
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::{http, WebViewBuilder};

// Embed static files from the "dist" directory
#[derive(RustEmbed)]
#[folder = "dist/"]
struct Assets;

fn main() -> wry::Result<()> {
    // Entry point: creates window, sets up custom protocol, runs event loop
    let event_loop = EventLoop::new();

    // Build application window with title and size
    let window = WindowBuilder::new()
        .with_title("Simulador de Memoria")
        .with_inner_size(tao::dpi::LogicalSize::new(800.0, 600.0))
        .build(&event_loop)
        .unwrap();

    #[cfg(any(target_os = "linux", target_os = "windows"))]
    // Create WebView builder for supported platforms
    let builder = WebViewBuilder::new(&window);

    // Register custom protocol to serve embedded assets
    let _webview = builder
        .with_custom_protocol("mi-app".into(), move |request| {
            let path = request.uri().path();

            // Resolve request path to asset, defaulting to index.html for root
            let asset_path = if path == "/" {
                "index.html"
            } else {
                path.trim_start_matches('/')
            };

            // Retrieve requested asset from embedded resources
            match Assets::get(asset_path) {
                Some(content_file) => {
                    // Determine MIME type based on file extension
                    let mime = mime_guess::from_path(asset_path).first_or_octet_stream();

                    http::Response::builder()
                        .status(200)
                        .header("Content-Type", mime.as_ref())
                        .header("Access-Control-Allow-Origin", "*")
                        .body(content_file.data)
                        .unwrap()
                }
                None => {
                    // Return 404 response when asset not found
                    http::Response::builder()
                        .status(404)
                        .header("Content-Type", "text/plain")
                        .body(Cow::from("Archivo no encontrado".as_bytes()))
                        .unwrap()
                }
            }
        })
        // Set initial URL using custom protocol
        .with_url("mi-app://localhost/")
        // Enable developer tools
        .with_devtools(true)
        .build()?;

    // Run event loop handling window events
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            // Log when application starts
            Event::NewEvents(StartCause::Init) => println!("Aplicación iniciada"),
            // Exit application on window close request
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            _ => (),
        }
    });
}
