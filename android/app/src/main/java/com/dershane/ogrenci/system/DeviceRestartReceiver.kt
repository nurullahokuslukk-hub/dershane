package com.dershane.ogrenci.system

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.dershane.ogrenci.offline.OfflineSyncWorker
import com.dershane.ogrenci.reminders.EveningDepartureReminderScheduler

/**
 * Restores only previously opted-in local work after a restart or clock-zone change.
 * No usage data is read and no network call is made on the broadcast's main thread.
 */
class DeviceRestartReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            -> {
                EveningDepartureReminderScheduler.rescheduleIfEnabled(context)
                OfflineSyncWorker.schedule(context)
            }
        }
    }
}
