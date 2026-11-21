package io.github.collogni27.planner;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

/**
 * Toca o alarme do "Bom dia" como um app de despertador: o próprio app toca o som
 * (no volume de ALARME, em repetição) e vibra, sem depender do som da notificação —
 * que alguns celulares (ex.: Xiaomi) silenciam para apps instalados fora da loja.
 * Para quando o Bom dia é atendido ou depois de 30 minutos.
 */
public class BomDiaServico extends Service {
    private MediaPlayer player;
    private Vibrator vibrador;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!BomDia.tocando(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(BomDia.ID_NOTIFICACAO, BomDia.construir(this), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(BomDia.ID_NOTIFICACAO, BomDia.construir(this));
        }
        if (player == null) tocar();
        handler.removeCallbacksAndMessages(null);
        handler.postDelayed(this::stopSelf, Math.max(1000, BomDia.restanteMs(this)));
        return START_NOT_STICKY;
    }

    private void tocar() {
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            player.setDataSource(this, Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.bom_dia));
            player.setLooping(true);
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            player.prepare();
            player.start();
        } catch (Exception e) {
            player = null; // sem som: a notificação e a vibração continuam
        }
        vibrador = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrador != null && vibrador.hasVibrator()) {
            long[] padrao = {0, 700, 500, 700, 1200};
            AudioAttributes alarme = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrador.vibrate(VibrationEffect.createWaveform(padrao, 0), alarme);
            } else {
                vibrador.vibrate(padrao, 0, alarme);
            }
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (player != null) {
            try {
                player.stop();
            } catch (Exception ignorado) {
                // já parado
            }
            player.release();
            player = null;
        }
        if (vibrador != null) vibrador.cancel();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
