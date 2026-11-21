package io.github.collogni27.planner;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Ponte entre o app (JavaScript) e o aviso "Bom dia" e os ajustes do Android. */
@CapacitorPlugin(name = "Alarmes")
public class AlarmesPlugin extends Plugin {
    private String destinoPendente = null;

    @Override
    public void load() {
        Intent i = getActivity().getIntent();
        if (i != null) destinoPendente = i.getStringExtra(BomDia.EXTRA_DESTINO);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        String destino = intent.getStringExtra(BomDia.EXTRA_DESTINO);
        if (destino == null) return;
        JSObject r = new JSObject();
        r.put("destino", destino);
        notifyListeners("destino", r);
    }

    @PluginMethod
    public void destinoPendente(PluginCall call) {
        JSObject r = new JSObject();
        r.put("destino", destinoPendente);
        destinoPendente = null;
        call.resolve(r);
    }

    @PluginMethod
    public void agendarBomDia(PluginCall call) {
        try {
            JSArray lista = call.getArray("horarios", new JSArray());
            long[] horarios = new long[lista.length()];
            for (int i = 0; i < lista.length(); i++) horarios[i] = lista.getLong(i);
            BomDia.agendar(getContext(), horarios);
            call.resolve();
        } catch (Exception e) {
            call.reject("Não foi possível agendar o Bom dia", e);
        }
    }

    @PluginMethod
    public void cancelarBomDia(PluginCall call) {
        BomDia.agendar(getContext(), new long[0]);
        call.resolve();
    }

    /** Teste: toca o Bom dia daqui a alguns segundos. */
    @PluginMethod
    public void testarBomDia(PluginCall call) {
        Context c = getContext();
        long quando = System.currentTimeMillis() + call.getInt("segundos", 10) * 1000L;
        BomDia.agendarUm(c, (AlarmManager) c.getSystemService(Context.ALARM_SERVICE), quando, 15);
        call.resolve();
    }

    @PluginMethod
    public void estadoBomDia(PluginCall call) {
        JSObject r = new JSObject();
        r.put("tocando", BomDia.tocando(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void encerrarBomDia(PluginCall call) {
        BomDia.encerrar(getContext());
        call.resolve();
    }

    @PluginMethod
    public void permissoes(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        r.put("alarmesExatos", Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms());
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        r.put("semOtimizacaoBateria", pm.isIgnoringBatteryOptimizations(c.getPackageName()));
        r.put("fabricante", Build.MANUFACTURER);
        call.resolve(r);
    }

    @PluginMethod
    public void abrirAjusteAlarmes(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            abrir(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName())));
        }
        call.resolve();
    }

    @PluginMethod
    public void abrirAjusteBateria(PluginCall call) {
        abrir(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName())));
        call.resolve();
    }

    /** Xiaomi/Redmi/Poco: tela de "Início automático" (necessária para avisos com o app fechado). */
    @PluginMethod
    public void abrirInicioAutomatico(PluginCall call) {
        Intent i = new Intent().setComponent(new android.content.ComponentName(
            "com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
        abrir(i);
        call.resolve();
    }

    @PluginMethod
    public void abrirAjusteNotificacoes(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        abrir(i);
        call.resolve();
    }

    private void abrir(Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (Exception e) {
            // Ajuste não existe neste celular: abre os detalhes do app.
            Intent detalhes = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            detalhes.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(detalhes);
        }
    }
}
