/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GRADLE_WRAPPER_PROPERTIES = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

export const SETTINGS_GRADLE = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Mungil"
include(":app")
`;

export const ROOT_BUILD_GRADLE = `plugins {
    id("com.android.application") version "8.1.4" apply false
    id("org.jetbrains.kotlin.android") version "1.9.10" apply false
}
`;

export const APP_BUILD_GRADLE = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.mungil.browser"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mungil.browser"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.9.0")
}
`;

export const GRADLE_PROPERTIES = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`;

export const PROGUARD_RULES = `# Proguard rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
`;

export const ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Mungil Browser"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.MungilBrowser"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- Mendukung Share link dari TikTok / YouTube -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;

export const MAIN_ACTIVITY_KT = `package com.mungil.browser

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.*
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var urlEditText: EditText
    private lateinit var progressBar: ProgressBar

    // Script Halo Sniffer versi injected (otomatis menyaring & mendownload)
    private val snifferInjectionScript = """
        (function() {
            if (window.__halo_injected) return;
            window.__halo_injected = true;

            console.log('[Mungil Browser] Halo Sniffer Active');

            // Floating indicator
            const badge = document.createElement('div');
            badge.id = 'mungil-badge';
            badge.innerText = '⚡ Mungil Sniffer';
            badge.style.position = 'fixed';
            badge.style.bottom = '20px';
            badge.style.right = '20px';
            badge.style.backgroundColor = '#10b981';
            badge.style.color = '#000';
            badge.style.padding = '8px 14px';
            badge.style.borderRadius = '20px';
            badge.style.fontSize = '12px';
            badge.style.fontWeight = 'bold';
            badge.style.zIndex = '999999';
            badge.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
            badge.style.display = 'none';
            badge.style.cursor = 'pointer';
            document.body.appendChild(badge);

            const detectedUrls = new Set();

            function notifyNative(url, title) {
                if (!url || detectedUrls.has(url)) return;
                detectedUrls.add(url);
                badge.style.display = 'block';
                badge.innerText = '⬇ Unduh Video (' + detectedUrls.size + ')';
                badge.onclick = function() {
                    if (window.AndroidDownloader) {
                        window.AndroidDownloader.downloadVideo(url, title || document.title);
                    }
                };
            }

            // Monitor media elements
            setInterval(() => {
                document.querySelectorAll('video, audio, source').forEach(el => {
                    const src = el.src || el.currentSrc;
                    if (src && src.startsWith('http')) {
                        notifyNative(src, document.title);
                    }
                });
            }, 1000);

            // Hook fetch
            const origFetch = window.fetch;
            window.fetch = async function(...args) {
                const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
                if (url && (url.includes('.mp4') || url.includes('.m3u8') || url.includes('v16-webapp') || url.includes('videoplayback') || url.includes('/pass_md5/'))) {
                    notifyNative(url, document.title);
                }
                return origFetch.apply(this, args);
            };
        })();
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        urlEditText = findViewById(R.id.urlEditText)
        progressBar = findViewById(R.id.progressBar)

        val btnGo: ImageButton = findViewById(R.id.btnGo)
        val btnBack: ImageButton = findViewById(R.id.btnBack)
        val btnRefresh: ImageButton = findViewById(R.id.btnRefresh)

        setupWebView()

        btnGo.setOnClickListener {
            loadInputUrl()
        }

        btnBack.setOnClickListener {
            if (webView.canGoBack()) webView.goBack()
        }

        btnRefresh.setOnClickListener {
            webView.reload()
        }

        // Tangani jika dibuka dari menu "Bagikan / Share" TikTok / YouTube
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!sharedText.isNullOrEmpty()) {
                val url = extractUrl(sharedText)
                if (url != null) {
                    urlEditText.setText(url)
                    webView.loadUrl(url)
                    return
                }
            }
        }

        // Halaman awal default
        webView.loadUrl("https://www.tiktok.com")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // User Agent desktop/mobile modern
        settings.userAgentString = settings.userAgentString + " MungilBrowser/1.0"

        // Hubungkan Interface Java/Kotlin ke JavaScript
        webView.addJavascriptInterface(AndroidBridge(), "AndroidDownloader")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                urlEditText.setText(url)
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Suntikkan sniffer otomatis saat web selesai memuat
                webView.evaluateJavascript(snifferInjectionScript, null)
            }

            override fun onLoadResource(view: WebView?, url: String?) {
                super.onLoadResource(view, url)
                // Sniffing stream video dari network resource
                if (url != null && (url.contains(".mp4") || url.contains(".m3u8") || url.contains("v16-webapp") || url.contains("videoplayback"))) {
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "if(window.__halo_injected) { notifyNative('$url', document.title); }",
                            null
                        )
                    }
                }
            }
        }
    }

    private fun loadInputUrl() {
        var input = urlEditText.text.toString().trim()
        if (input.isEmpty()) return

        if (!input.startsWith("http://") && !input.startsWith("https://")) {
            input = if (input.contains(".") && !input.contains(" ")) {
                "https://$input"
            } else {
                "https://www.google.com/search?q=" + Uri.encode(input)
            }
        }
        webView.loadUrl(input)
    }

    private fun extractUrl(text: String): String? {
        val parts = text.split("\\s+".toRegex())
        for (part in parts) {
            if (part.startsWith("http://") || part.startsWith("https://")) {
                return part
            }
        }
        return null
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun downloadVideo(videoUrl: String, title: String?) {
            runOnUiThread {
                try {
                    val cleanTitle = (title ?: "video")
                        .replace("[^a-zA-Z0-9_-]".toRegex(), "_")
                        .take(35)
                    val fileName = "\${cleanTitle}_\${System.currentTimeMillis()}.mp4"

                    val request = DownloadManager.Request(Uri.parse(videoUrl)).apply {
                        setTitle("Mengunduh: $fileName")
                        setDescription("Video Mungil Downloader")
                        setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                        addRequestHeader("User-Agent", webView.settings.userAgentString)
                        addRequestHeader("Referer", webView.url ?: "https://www.tiktok.com/")
                    }

                    val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    dm.enqueue(request)

                    Toast.makeText(this@MainActivity, "⬇ Mengunduh $fileName ke folder Download...", Toast.LENGTH_LONG).show()
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Gagal mengunduh: \${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`;

export const ACTIVITY_MAIN_XML = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#121212">

    <!-- Top Navigation Bar -->
    <LinearLayout
        android:id="@+id/topBar"
        android:layout_width="match_parent"
        android:layout_height="56dp"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:paddingHorizontal="8dp"
        android:background="#1e1e1e"
        app:layout_constraintTop_toTopOf="parent">

        <ImageButton
            android:id="@+id/btnBack"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@android:drawable/ic_media_previous"
            app:tint="#ffffff"
            android:contentDescription="Kembali" />

        <EditText
            android:id="@+id/urlEditText"
            android:layout_width="0dp"
            android:layout_height="40dp"
            android:layout_weight="1"
            android:layout_marginHorizontal="8dp"
            android:background="@drawable/bg_url_input"
            android:paddingHorizontal="12dp"
            android:hint="Cari atau masukkan URL..."
            android:textColorHint="#888888"
            android:textColor="#ffffff"
            android:textSize="13sp"
            android:imeOptions="actionGo"
            android:inputType="textUri"
            android:maxLines="1" />

        <ImageButton
            android:id="@+id/btnRefresh"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@android:drawable/ic_menu_rotate"
            app:tint="#ffffff"
            android:contentDescription="Muat Ulang" />

        <ImageButton
            android:id="@+id/btnGo"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@android:drawable/ic_menu_send"
            app:tint="#10b981"
            android:contentDescription="Buka" />
    </LinearLayout>

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:progressDrawable="@drawable/progress_bar_custom"
        android:visibility="gone"
        app:layout_constraintTop_toBottomOf="@id/topBar" />

    <!-- Main Web Content -->
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintTop_toBottomOf="@id/progressBar"
        app:layout_constraintBottom_toBottomOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`;

export const STYLES_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.MungilBrowser" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">#10b981</item>
        <item name="colorPrimaryVariant">#059669</item>
        <item name="colorOnPrimary">#000000</item>
        <item name="android:statusBarColor">#1e1e1e</item>
        <item name="android:navigationBarColor">#121212</item>
    </style>
</resources>
`;

export const BG_URL_INPUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#2a2a2a" />
    <corners android:radius="8dp" />
    <stroke android:width="1dp" android:color="#3a3a3a" />
</shape>
`;

export const PROGRESS_BAR_XML = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/background">
        <color android:color="#1e1e1e" />
    </item>
    <item android:id="@android:id/progress">
        <clip>
            <color android:color="#10b981" />
        </clip>
    </item>
</layer-list>
`;

export const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
</full-backup-content>
`;

export const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude path="." />
    </cloud-backup>
</data-extraction-rules>
`;

export const GITHUB_WORKFLOW_FIXED_YAML = `name: Build Mungil Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Generate APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Make Gradle Wrapper Executable
        run: chmod +x gradlew || true

      - name: Build Debug APK with Gradle
        run: ./gradlew assembleDebug --stacktrace --no-daemon

      - name: Upload APK to Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Mungil-Browser-APK
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 14
`;

export const GRADLEW_BASH = `#!/usr/bin/env sh

# Gradle start up script for POSIX systems
# Copyright 2015 the original author or authors.

APP_NAME="Gradle"
APP_BASE_NAME=\`basename "$0"\`

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
}

die () {
    echo
    echo "$*"
    echo
    exit 1
}

# OS specific support (both Darwin and Linux)
darwin=false
case "\`uname\`" in
  Darwin* )
    darwin=true
    ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

# Locate gradle wrapper jar or run gradle directly via wrapper downloader
exec "$JAVACMD" "-Dorg.gradle.appname=$APP_BASE_NAME" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`;
