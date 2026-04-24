package com.moviecatalogue.app;

import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private boolean streamZonePlayerMode = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        webView.addJavascriptInterface(new StreamZoneNativeBridge(), "StreamZoneNative");
        webView.setWebChromeClient(new StreamZoneWebChromeClient(getBridge()));
        getBridge().setWebViewClient(new StreamZoneWebViewClient(getBridge()));
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchNativeBack();
            }
        });

        WebView.setWebContentsDebuggingEnabled(true);
    }

    private class StreamZoneWebChromeClient extends BridgeWebChromeClient {
        StreamZoneWebChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            return false;
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && streamZonePlayerMode) {
            hideSystemUi();
        }
    }

    private void setStreamZonePlayerMode(boolean enabled) {
        streamZonePlayerMode = enabled;
        if (enabled) {
            hideSystemUi();
        } else {
            showSystemUi();
        }
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private void showSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private void dispatchNativeBack() {
        WebView webView = getBridge().getWebView();
        webView.post(() -> webView.evaluateJavascript(
            "window.dispatchEvent(new Event('categloge:native-back'))",
            null
        ));
    }

    private boolean isStreamingPlayer(WebView view) {
        String currentUrl = view.getUrl();
        return currentUrl != null && currentUrl.contains("/streaming/player");
    }

    private boolean isLocalAppUrl(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return "capacitor".equals(scheme)
            || "ionic".equals(scheme)
            || "localhost".equals(host)
            || "127.0.0.1".equals(host);
    }

    public class StreamZoneNativeBridge {
        @JavascriptInterface
        public void setPlayerMode(boolean enabled) {
            runOnUiThread(() -> setStreamZonePlayerMode(enabled));
        }
    }

    private class StreamZoneWebViewClient extends BridgeWebViewClient {
        StreamZoneWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (request.isForMainFrame() && isStreamingPlayer(view) && !isLocalAppUrl(url)) {
                return true;
            }
            return super.shouldOverrideUrlLoading(view, request);
        }
    }
}
