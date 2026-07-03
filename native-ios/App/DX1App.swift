import SwiftUI

@main
struct DX1App: App {
    @StateObject private var audio = AudioEngineController()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(audio)
                .preferredColorScheme(.dark)
                .persistentSystemOverlays(.hidden)
                .onAppear { audio.start() }
        }
    }
}
