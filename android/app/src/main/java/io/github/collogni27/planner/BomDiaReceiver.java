package io.github.collogni27.planner;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Recebe: a hora do alarme, a notificação deslizada (repor) e o celular reiniciado. */
public class BomDiaReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        String acao = intent.getAction();
        if (BomDia.ACAO_DISPARAR.equals(acao)) {
            BomDia.disparar(c);
        } else if (BomDia.ACAO_REPOR.equals(acao)) {
            // Deslizou para o lado: volta na hora (se ainda dentro dos 30 minutos).
            BomDia.mostrar(c);
        } else if (Intent.ACTION_BOOT_COMPLETED.equals(acao) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(acao)) {
            BomDia.agendarSalvos(c);
        }
    }
}
