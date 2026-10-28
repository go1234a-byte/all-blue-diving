import UIKit
import Capacitor

/// iOS now hard-crashes an app with no UIScene lifecycle adoption at launch (observed on-device as
/// EXC_BREAKPOINT in UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption) — this app only
/// ever had AppDelegate.window and no scene manifest, which is what that check was failing on.
/// `window` is left for UIKit to populate: Info.plist's UIApplicationSceneManifest points this
/// scene at Main.storyboard, so UIKit instantiates CAPBridgeViewController from it and assigns the
/// window automatically before willConnectTo runs — same as the Xcode storyboard-app template.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
