package io.github.collogni27.planner;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;

/**
 * Aviso "Bom dia" insistente (docs/notificacoes.md).
 * - Agendado como alarme de despertador (setAlarmClock): toca no minuto certo, mesmo com o
 *   celular em economia de energia.
 * - Notificação contínua, com som de alarme repetindo (FLAG_INSISTENT).
 * - Se for deslizada para o lado, o Android avisa (deleteIntent) e ela volta na hora,
 *   até ser tocada (o app chama encerrar) ou passarem 30 minutos.
 */
public final class BomDia {
    static final String PREFS = "planner_bom_dia";
    // Canal novo (v2): silencioso, porque o som e a vibração vêm do BomDiaServico.
    // (Canais não mudam depois de criados; por isso um id novo.)
    static final String CANAL = "bom_dia_v2";
    static final int ID_NOTIFICACAO = 4242;
    static final long DURACAO_MS = 30L * 60L * 1000L;

    static final String ACAO_DISPARAR = "io.github.collogni27.planner.BOM_DIA_DISPARAR";
    static final String ACAO_REPOR = "io.github.collogni27.planner.BOM_DIA_REPOR";
    static final String EXTRA_DESTINO = "destino";

    private BomDia() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Guarda os horários (para reagendar depois de reiniciar) e agenda os alarmes. */
    static void agendar(Context c, long[] horarios) {
        cancelarAlarmes(c);
        JSONArray lista = new JSONArray();
        for (long h : horarios) lista.put(h);
        prefs(c).edit().putString("horarios", lista.toString()).apply();
        agendarSalvos(c);
    }

    /** Agenda os alarmes guardados que ainda estão no futuro. */
    static void agendarSalvos(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        long agora = System.currentTimeMillis();
        try {
            JSONArray lista = new JSONArray(prefs(c).getString("horarios", "[]"));
            for (int i = 0; i < lista.length(); i++) {
                long quando = lista.getLong(i);
                if (quando <= agora) continue;
                agendarUm(c, am, quando, i);
            }
        } catch (Exception ignorado) {
            // lista inválida: nada a agendar
        }
    }

    static void agendarUm(Context c, AlarmManager am, long quando, int codigo) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) return;
        PendingIntent disparo = PendingIntent.getBroadcast(c, codigo, new Intent(c, BomDiaReceiver.class).setAction(ACAO_DISPARAR), flags());
        PendingIntent abrir = PendingIntent.getActivity(c, 9000 + codigo, intentAbrir(c), flags());
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(quando, abrir), disparo);
    }

    static void cancelarAlarmes(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        for (int i = 0; i < 16; i++) {
            PendingIntent p = PendingIntent.getBroadcast(c, i, new Intent(c, BomDiaReceiver.class).setAction(ACAO_DISPARAR), flags());
            am.cancel(p);
        }
    }

    /** Começa a tocar: marca o início e liga o serviço que toca o alarme. */
    static void disparar(Context c) {
        prefs(c).edit().putLong("inicio", System.currentTimeMillis()).putBoolean("atendido", false).apply();
        androidx.core.content.ContextCompat.startForegroundService(c, new Intent(c, BomDiaServico.class));
    }

    static long restanteMs(Context c) {
        return DURACAO_MS - (System.currentTimeMillis() - prefs(c).getLong("inicio", 0));
    }

    /** Ainda tocando? (não foi atendido e não passaram 30 minutos) */
    static boolean tocando(Context c) {
        SharedPreferences p = prefs(c);
        long inicio = p.getLong("inicio", 0);
        return inicio > 0 && !p.getBoolean("atendido", true) && System.currentTimeMillis() - inicio < DURACAO_MS;
    }

    /** Tocou na notificação (ou abriu o app): para de insistir. */
    static void encerrar(Context c) {
        prefs(c).edit().putBoolean("atendido", true).apply();
        c.stopService(new Intent(c, BomDiaServico.class));
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.cancel(ID_NOTIFICACAO);
    }

    /** Notificação deslizada: volta na hora (o som continua tocando pelo serviço). */
    static void mostrar(Context c) {
        if (!tocando(c)) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(ID_NOTIFICACAO, construir(c));
    }

    static Notification construir(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        criarCanal(nm);
        PendingIntent abrir = PendingIntent.getActivity(c, 8000, intentAbrir(c), flags());
        PendingIntent repor = PendingIntent.getBroadcast(c, 8001, new Intent(c, BomDiaReceiver.class).setAction(ACAO_REPOR), flags());
        return new NotificationCompat.Builder(c, CANAL)
            .setSmallIcon(R.drawable.ic_stat_planner)
            .setContentTitle("Bom dia")
            .setContentText("Toque para começar o dia.")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .setAutoCancel(true)
            .setSilent(true)
            .setContentIntent(abrir)
            .setDeleteIntent(repor)
            .setTimeoutAfter(Math.max(1000, restanteMs(c)))
            .build();
    }

    static void criarCanal(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || nm.getNotificationChannel(CANAL) != null) return;
        nm.deleteNotificationChannel("bom_dia"); // canal antigo (0.4.1)
        NotificationChannel canal = new NotificationChannel(CANAL, "Bom dia", NotificationManager.IMPORTANCE_HIGH);
        canal.setDescription("Aviso insistente do horário de acordar");
        canal.setSound(null, null); // o som vem do BomDiaServico
        canal.enableVibration(false);
        canal.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(canal);
    }

    static Intent intentAbrir(Context c) {
        return new Intent(c, MainActivity.class)
            .putExtra(EXTRA_DESTINO, "bom-dia")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    }

    static int flags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
    }
}
