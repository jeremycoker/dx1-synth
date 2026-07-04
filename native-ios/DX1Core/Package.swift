// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "DX1Core",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(name: "DX1Core", targets: ["DX1Core"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-atomics.git", from: "1.2.0"),
    ],
    targets: [
        .target(
            name: "DX1Core",
            dependencies: [
                .product(name: "Atomics", package: "swift-atomics"),
            ]
        ),
        .executableTarget(
            name: "dx1render",
            dependencies: ["DX1Core"]
        ),
        .testTarget(
            name: "DX1CoreTests",
            dependencies: ["DX1Core"]
        ),
    ]
)
