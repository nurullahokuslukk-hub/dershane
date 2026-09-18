package com.dershane.ogrenci.data

import com.dershane.ogrenci.BuildConfig
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

/** Tek istemci; Android ve web aynı Supabase Auth, tablolar ve RLS politikalarını kullanır. */
object SupabaseProvider {
    val client by lazy {
        check(BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) {
            "Supabase ayarları eksik. android/local.properties dosyasını yapılandırın."
        }

        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
        ) {
            install(Auth)
            install(Postgrest)
        }
    }
}
