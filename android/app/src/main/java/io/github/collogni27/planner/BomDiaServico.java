package io.github.collogni27.planner;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
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
    private float alvo = 1f;
    private final Runnable parar = this::stopSelf;

    /**
     * Volume do Bom dia: o volume de alarme deixava o som muito mais alto que as
     * notificações, mesmo com as duas barras iguais. Agora a base é o volume de
     * NOTIFICAÇÃO: com as barras iguais, o alarme toca a ~40% da força total do volume
     * de alarme (um pouco mais alto que um aviso comum, sem susto). Com a barra de
     * notificação zerada, usa a mesma proporção sobre o volume de alarme (para ainda acordar).
     */
    static final float PROPORCAO = 0.4f;
    /** Começa em 40% do volume escolhido e sobe até ele em 20 s. */
    static final float INICIO_SUAVE = 0.4f;
    static final long SUBIDA_MS = 20_000;
    static final long PASSO_MS = 1_000;

    private float volumeAlvo() {
        AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audio == null) return PROPORCAO;
        float notificacao = fracao(audio, AudioManager.STREAM_NOTIFICATION);
        float alarme = fracao(audio, AudioManager.STREAM_ALARM);
        if (alarme <= 0f) return 1f; // alarme no mudo: o Android já silencia; nada a ajustar
        if (notificacao <= 0f) return PROPORCAO;
        return Math.max(0.05f, Math.min(1f, PROPORCAO * notificacao / alarme));
    }

    private static float fracao(AudioManager audio, int fluxo) {
        int max = audio.getStreamMaxVolume(fluxo);
        return max > 0 ? (float) audio.getStreamVolume(fluxo) / max : 0f;
    }

    /** Sobe o volume aos poucos, do início suave até o alvo. */
    private void subirVolume(long decorrido) {
        if (player == null || decorrido >= SUBIDA_MS) return;
        handler.postDelayed(() -> {
            if (player == null) return;
            long agora = decorrido + PASSO_MS;
            float f = INICIO_SUAVE + (1f - INICIO_SUAVE) * Math.min(1f, (float) agora / SUBIDA_MS);
            try {
                player.setVolume(alvo * f, alvo * f);
            } catch (Exception ignorado) {
                return;
            }
            subirVolume(agora);
        }, PASSO_MS);
    }

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
        handler.removeCallbacks(parar); // só o "parar"; a subida do volume continua
        handler.postDelayed(parar, Math.max(1000, BomDia.restanteMs(this)));
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
            alvo = volumeAlvo();
            player.setVolume(alvo * INICIO_SUAVE, alvo * INICIO_SUAVE);
            player.start();
            subirVolume(0);
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
