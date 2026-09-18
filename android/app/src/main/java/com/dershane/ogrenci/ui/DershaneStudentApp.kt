package com.dershane.ogrenci.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Assignment
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.outlined.AutoGraph
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Quiz
import androidx.compose.material.icons.outlined.SentimentSatisfiedAlt
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dershane.ogrenci.auth.AuthUiState
import com.dershane.ogrenci.auth.AuthViewModel
import com.dershane.ogrenci.auth.StudentAccount
import com.dershane.ogrenci.data.DershanePresence
import com.dershane.ogrenci.data.DershanePresenceRepository
import com.dershane.ogrenci.reminders.EveningDepartureReminderScheduler
import kotlinx.coroutines.launch

private enum class StudentDestination { HOME, HOMEWORK, PROGRESS, PROFILE, CHECKIN, STUDY, QUESTION }

@Composable
fun DershaneStudentApp(viewModel: AuthViewModel = viewModel()) {
    val state by viewModel.state.collectAsState()
    StudentTheme {
        when (val current = state) {
            AuthUiState.CheckingSession -> SplashScreen()
            AuthUiState.SignedOut -> LoginScreen(onSignIn = viewModel::signIn, onReset = viewModel::sendPasswordReset)
            is AuthUiState.SignedIn -> StudentHub(current.account, viewModel::signOut)
            is AuthUiState.Failure -> LoginScreen(current.message, onSignIn = viewModel::signIn, onReset = viewModel::sendPasswordReset)
            is AuthUiState.ResetEmailSent -> LoginScreen(info = "Sıfırlama bağlantısı ${current.email} adresine gönderildi.", onSignIn = viewModel::signIn, onReset = viewModel::sendPasswordReset)
        }
    }
}

@Composable
private fun StudentHub(account: StudentAccount, onSignOut: () -> Unit) {
    var destination by rememberSaveable { mutableStateOf(StudentDestination.HOME) }
    var actionSheetOpen by rememberSaveable { mutableStateOf(false) }
    Box(Modifier.fillMaxSize().background(appBackground())) {
        when (destination) {
            StudentDestination.HOME -> HomeScreen(account.id, account.fullName) { destination = it }
            StudentDestination.HOMEWORK -> EmptySection("Ödevler", "Öğretmeninin verdiği ödevler burada görünecek.")
            StudentDestination.PROGRESS -> EmptySection("Gelişim", "Deneme sonuçların ve çalışma trendin burada toplanacak.")
            StudentDestination.PROFILE -> ProfileScreen(account.fullName, onSignOut)
            StudentDestination.CHECKIN -> EntryScreen("Günlük bildirim", "Bugün nasıl geçti?", Icons.Outlined.SentimentSatisfiedAlt) { destination = StudentDestination.HOME }
            StudentDestination.STUDY -> EntryScreen("Çalışma kaydı", "Bugün ne çalıştın?", Icons.Outlined.Timer) { destination = StudentDestination.HOME }
            StudentDestination.QUESTION -> EntryScreen("Soru kaydı", "Bugün kaç soru çözdün?", Icons.Outlined.Quiz) { destination = StudentDestination.HOME }
        }
        if (actionSheetOpen) StudentActionSheet(
            onClose = { actionSheetOpen = false },
            onSelect = { actionSheetOpen = false; destination = it },
        )
        StudentBottomBar(destination, { destination = it }, { actionSheetOpen = !actionSheetOpen })
    }
}

@Composable
private fun HomeScreen(accountId: String, fullName: String, onDestination: (StudentDestination) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("Merhaba, ${fullName.substringBefore(" ")}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = Ink)
            Text("Bugün kendin için küçük bir adım yeter.", color = InkMuted, modifier = Modifier.padding(top = 4.dp))
        }
        item { DershanePresenceBubble(accountId) }
        item { Text("Bu hafta", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = 6.dp)) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatBubble("Çalışma", "Henüz kayıt yok", Mint, Modifier.weight(1f))
                StatBubble("Sorular", "Henüz kayıt yok", Peach, Modifier.weight(1f))
            }
        }
        item {
            GlassPanel {
                Text("Burayı birlikte dolduralım", fontWeight = FontWeight.SemiBold)
                Text("Çalışma süreni veya çözdüğün soruları eklediğinde gelişimini burada göreceksin.", color = InkMuted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 6.dp))
                Row(Modifier.padding(top = 14.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MiniAction("Çalışma", Icons.Outlined.Timer) { onDestination(StudentDestination.STUDY) }
                    MiniAction("Soru", Icons.Outlined.Quiz) { onDestination(StudentDestination.QUESTION) }
                }
            }
        }
        item { Text("Takip et", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = 6.dp)) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickRoute("Ödevler", "Bekleyenler burada", Icons.AutoMirrored.Outlined.Assignment, Modifier.weight(1f)) { onDestination(StudentDestination.HOMEWORK) }
                QuickRoute("Denemeler", "Sonuçlarını incele", Icons.Outlined.AutoGraph, Modifier.weight(1f)) { onDestination(StudentDestination.PROGRESS) }
            }
        }
        item { Spacer(Modifier.height(82.dp)) }
    }
}

@Composable
private fun DershanePresenceBubble(accountId: String) {
    val repository = remember { DershanePresenceRepository() }
    val scope = rememberCoroutineScope()
    var presence by remember { mutableStateOf<DershanePresence?>(null) }
    var loaded by remember { mutableStateOf(false) }
    var confirmingAttendance by rememberSaveable { mutableStateOf(false) }
    var arrivalTime by rememberSaveable { mutableStateOf("") }
    var departureTime by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    androidx.compose.runtime.LaunchedEffect(accountId) {
        runCatching { repository.loadToday(accountId) }
            .onSuccess { presence = it }
            .onFailure { error = "Devam bilgisi şu an alınamadı." }
        loaded = true
    }

    GlassPanel {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(color = Lavender.copy(alpha = .14f), shape = CircleShape, modifier = Modifier.size(46.dp)) {
                Icon(Icons.Outlined.SentimentSatisfiedAlt, null, tint = Lavender, modifier = Modifier.padding(11.dp))
            }
            Column(Modifier.padding(start = 14.dp)) {
                Text("Günlük dershane düzenin", fontWeight = FontWeight.SemiBold)
                Text("Bu bilgiyi kontrol için değil, gerektiğinde sana doğru desteği sunmak için istiyoruz.", color = InkMuted, style = MaterialTheme.typography.bodySmall)
            }
        }
        if (!loaded) {
            CircularProgressIndicator(modifier = Modifier.padding(top = 14.dp).size(24.dp), color = Lavender)
        } else when (val current = presence) {
            null -> {
                Text("Bugün dershaneye gittin mi?", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 16.dp))
                Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MiniAction("Gittim", Icons.Outlined.SentimentSatisfiedAlt) { confirmingAttendance = true }
                    MiniAction("Gitmedim", Icons.Outlined.Close) {
                        scope.launch {
                            runCatching { repository.reportArrival(accountId, attended = false, arrivedAt = null) }
                                .onSuccess { presence = it }
                                .onFailure { error = "Kaydedilemedi; bağlantını kontrol edip tekrar dene." }
                        }
                    }
                }
                if (confirmingAttendance) {
                    OutlinedTextField(arrivalTime, { arrivalTime = it }, label = { Text("Dershaneye saat kaçta başladın? (SS:DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
                    Button(onClick = {
                        scope.launch {
                            runCatching { repository.reportArrival(accountId, attended = true, arrivedAt = arrivalTime) }
                                .onSuccess { presence = it }
                                .onFailure { error = "Giriş saati kaydedilemedi." }
                        }
                    }, enabled = isClockTime(arrivalTime), modifier = Modifier.padding(top = 8.dp)) { Text("Giriş saatini kaydet") }
                }
            }
            else -> PresenceCompletion(current, departureTime, { departureTime = it }) {
                scope.launch {
                    runCatching { repository.reportDeparture(accountId, departureTime) }
                        .onSuccess { presence = it }
                        .onFailure { error = "Çıkış saati kaydedilemedi." }
                }
            }
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }
    }
}

@Composable
private fun PresenceCompletion(current: DershanePresence, departureTime: String, onDepartureChange: (String) -> Unit, onSaveDeparture: () -> Unit) {
    if (!current.attended) {
        Text("Bugün için kaydın alındı. Yarın yeniden soracağız.", color = InkMuted, modifier = Modifier.padding(top = 14.dp))
    } else if (current.departedAt == null) {
        Text("Giriş: ${current.arrivedAt}. Akşam çıkış saatini de eklersen gününü daha iyi anlayabiliriz.", color = InkMuted, modifier = Modifier.padding(top = 14.dp))
        OutlinedTextField(departureTime, onDepartureChange, label = { Text("Dershaneden saat kaçta çıktın? (SS:DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
        Button(onClick = onSaveDeparture, enabled = isClockTime(departureTime), modifier = Modifier.padding(top = 8.dp)) { Text("Çıkış saatini kaydet") }
    } else {
        Text("Bugün ${current.arrivedAt}–${current.departedAt} arasındaki dershane kaydın alındı.", color = InkMuted, modifier = Modifier.padding(top = 14.dp))
    }
}

@Composable
private fun StatBubble(title: String, value: String, accent: Color, modifier: Modifier) = GlassPanel(modifier) {
    Surface(color = accent.copy(alpha = .18f), shape = CircleShape, modifier = Modifier.size(34.dp)) {}
    Text(title, color = InkMuted, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 10.dp))
    Text(value, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
}

@Composable
private fun MiniAction(label: String, icon: ImageVector, onClick: () -> Unit) {
    Surface(color = Ink, shape = RoundedCornerShape(18.dp), modifier = Modifier.clickable(onClick = onClick)) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size(17.dp))
            Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(start = 6.dp))
        }
    }
}

@Composable
private fun QuickRoute(title: String, subtitle: String, icon: ImageVector, modifier: Modifier, onClick: () -> Unit) = GlassPanel(modifier.clickable(onClick = onClick)) {
    Icon(icon, null, tint = Lavender)
    Text(title, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 10.dp))
    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = InkMuted)
}

@Composable
private fun BoxScope.StudentActionSheet(onClose: () -> Unit, onSelect: (StudentDestination) -> Unit) {
    Surface(
        modifier = Modifier.align(Alignment.BottomCenter).padding(start = 28.dp, end = 28.dp, bottom = 106.dp).fillMaxWidth().shadow(24.dp, RoundedCornerShape(30.dp)),
        shape = RoundedCornerShape(30.dp), color = Color(0xFDFDFEFF),
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Bugün ne eklemek istersin?", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                IconButton(onClick = onClose) { Icon(Icons.Outlined.Close, "Kapat") }
            }
            ActionChoice("Günlük bildirim", "Günün nasıl geçtiğini paylaş", Icons.Outlined.SentimentSatisfiedAlt) { onSelect(StudentDestination.CHECKIN) }
            ActionChoice("Çalışma kaydı", "Çalıştığın süreyi ekle", Icons.Outlined.Timer) { onSelect(StudentDestination.STUDY) }
            ActionChoice("Soru kaydı", "Çözdüğün soruları ekle", Icons.Outlined.Quiz) { onSelect(StudentDestination.QUESTION) }
        }
    }
}

@Composable
private fun ActionChoice(title: String, subtitle: String, icon: ImageVector, onClick: () -> Unit) {
    Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFFF4F5FC), modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = Lavender)
            Column(Modifier.padding(start = 12.dp)) { Text(title, fontWeight = FontWeight.SemiBold); Text(subtitle, color = InkMuted, style = MaterialTheme.typography.bodySmall) }
        }
    }
}

@Composable
private fun BoxScope.StudentBottomBar(active: StudentDestination, onSelect: (StudentDestination) -> Unit, onAction: () -> Unit) {
    Surface(
        modifier = Modifier.align(Alignment.BottomCenter).padding(horizontal = 20.dp, vertical = 20.dp).fillMaxWidth().height(68.dp).glassBubble(RoundedCornerShape(32.dp)),
        color = Color.Transparent, shape = RoundedCornerShape(32.dp),
    ) {
        Row(Modifier.fillMaxSize().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            NavItem("Ana sayfa", Icons.Outlined.Home, active == StudentDestination.HOME) { onSelect(StudentDestination.HOME) }
            NavItem("Ödevler", Icons.AutoMirrored.Outlined.Assignment, active == StudentDestination.HOMEWORK) { onSelect(StudentDestination.HOMEWORK) }
            Spacer(Modifier.width(52.dp))
            NavItem("Gelişim", Icons.Outlined.AutoGraph, active == StudentDestination.PROGRESS) { onSelect(StudentDestination.PROGRESS) }
            NavItem("Profil", Icons.Outlined.PersonOutline, active == StudentDestination.PROFILE) { onSelect(StudentDestination.PROFILE) }
        }
    }
    Surface(modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 55.dp).size(62.dp).shadow(14.dp, CircleShape), shape = CircleShape, color = Ink, onClick = onAction) {
        Box(contentAlignment = Alignment.Center) { Icon(Icons.AutoMirrored.Outlined.MenuBook, "Öğrenci kayıtları", tint = Color.White) }
    }
}

@Composable
private fun NavItem(label: String, icon: ImageVector, selected: Boolean, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clip(RoundedCornerShape(14.dp)).clickable(onClick = onClick).padding(4.dp)) {
        Icon(icon, label, tint = if (selected) Lavender else InkMuted, modifier = Modifier.size(21.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = if (selected) Lavender else InkMuted)
    }
}

@Composable
private fun EntryScreen(title: String, prompt: String, icon: ImageVector, onBack: () -> Unit) {
    var detail by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = Ink)
        GlassPanel {
            Icon(icon, null, tint = Lavender, modifier = Modifier.size(28.dp))
            Text(prompt, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 12.dp))
            OutlinedTextField(detail, { detail = it }, label = { Text("Notun (isteğe bağlı)") }, modifier = Modifier.fillMaxWidth().padding(top = 12.dp))
            Text("Gönderme adımı, güvenli öğrenci-RLS güncellemesi Supabase'e uygulandıktan sonra aktif olacak.", style = MaterialTheme.typography.bodySmall, color = InkMuted, modifier = Modifier.padding(top = 10.dp))
        }
        Button(onClick = onBack) { Text("Ana sayfaya dön") }
    }
}

@Composable
private fun EmptySection(title: String, message: String) = Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
    GlassPanel { Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text(message, color = InkMuted, modifier = Modifier.padding(top = 8.dp)) }
}

@Composable
private fun ProfileScreen(fullName: String, onSignOut: () -> Unit) {
    val context = LocalContext.current
    var reminderInfo by remember { mutableStateOf<String?>(null) }
    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            EveningDepartureReminderScheduler.schedule(context)
            reminderInfo = "20.00 civarı çıkış saati hatırlatması açık."
        } else reminderInfo = "Hatırlatma kapalı. İstersen daha sonra izin verebilirsin."
    }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)) {
        GlassPanel {
            Text(fullName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Hesap ve izinlerini buradan yönetebilirsin.", color = InkMuted, modifier = Modifier.padding(top = 6.dp))
        }
        GlassPanel {
            Text("Dershane çıkış hatırlatması", fontWeight = FontWeight.SemiBold)
            Text("20.00 civarı, yalnızca çıkış saatini eklemeyi hatırlatır. Konumunu takip etmez.", color = InkMuted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 6.dp))
            Button(onClick = {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                    ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
                ) {
                    EveningDepartureReminderScheduler.schedule(context)
                    reminderInfo = "20.00 civarı çıkış saati hatırlatması açık."
                } else notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }, modifier = Modifier.padding(top = 12.dp)) { Text("Hatırlatmayı aç") }
            reminderInfo?.let { Text(it, color = InkMuted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }
        }
        Button(onClick = onSignOut) { Text("Çıkış yap") }
    }
}

private fun isClockTime(value: String): Boolean = value.matches(Regex("(?:[01]\\d|2[0-3]):[0-5]\\d"))

@Composable
private fun SplashScreen() = Column(Modifier.fillMaxSize().background(appBackground()), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
    CircularProgressIndicator(color = Lavender); Text("Oturumun kontrol ediliyor…", modifier = Modifier.padding(top = 16.dp), color = Ink)
}

@Composable
private fun LoginScreen(error: String? = null, info: String? = null, onSignIn: (String, String) -> Unit, onReset: (String) -> Unit) {
    var identifier by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().background(appBackground()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp, Alignment.CenterVertically)) {
        Text("Dershane Öğrenci", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = Ink)
        Text("Gelişimini sakin ve düzenli takip et.", color = InkMuted)
        GlassPanel {
            OutlinedTextField(identifier, { identifier = it }, label = { Text("E-posta veya telefon") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(password, { password = it }, label = { Text("Şifre") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
            Button(onClick = { onSignIn(identifier, password) }, modifier = Modifier.fillMaxWidth().padding(top = 14.dp)) { Text("Giriş yap") }
        }
        if (identifier.contains("@")) Text("Şifreni unuttuysan e-posta sıfırlama bağlantısı isteyebilirsin.", color = Lavender, modifier = Modifier.clickable { onReset(identifier) })
        else Text("Telefonla giriş yapanlar şifre sıfırlama için dershane yönetimine başvurabilir.", color = InkMuted, style = MaterialTheme.typography.bodySmall)
        Text("Hesabın yok mu? Dershanenden aldığın kodu webdeki /claim sayfasında kullan.", color = InkMuted, style = MaterialTheme.typography.bodySmall)
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }; info?.let { Text(it, color = Lavender) }
    }
}
