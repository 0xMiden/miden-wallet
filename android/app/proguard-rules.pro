# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor WebView rules
# Keep Capacitor classes and plugins
-keep class com.getcapacitor.** { *; }
-keep class com.miden.wallet.** { *; }

# Keep JavaScript interfaces for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# Keep R8 from stripping interface methods
-keep interface * {
    <methods>;
}

# Preserve the line number information for debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# Hide the original source file name in stack traces
-renamesourcefileattribute SourceFile

# Biometric plugin
-keep class androidx.biometric.** { *; }
-keep class com.niceforyou.biometric.** { *; }

# Haptics plugin
-keep class com.capacitorjs.plugins.haptics.** { *; }

# Preferences plugin
-keep class com.capacitorjs.plugins.preferences.** { *; }

# Keyboard plugin
-keep class com.capacitorjs.plugins.keyboard.** { *; }

# Splash Screen plugin
-keep class com.capacitorjs.plugins.splashscreen.** { *; }

# Status Bar plugin
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# In-App Browser plugin
-keep class ee.niceforyou.inappbrowser.** { *; }
-keep class com.niceforyou.inappbrowser.** { *; }

# Don't warn about missing classes in optional dependencies
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
