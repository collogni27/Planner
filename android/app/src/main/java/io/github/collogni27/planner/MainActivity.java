package io.github.collogni27.planner;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin próprio do Planner (aviso "Bom dia" e ajustes do Android).
        registerPlugin(AlarmesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
