package com.dershane.ogrenci.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val Ink = Color(0xFF101827)
val InkMuted = Color(0xFF637083)
val Lavender = Color(0xFF7C63F2)
val Mint = Color(0xFF5EC7B1)
val Peach = Color(0xFFFFB486)
val Glass = Color.White.copy(alpha = 0.72f)
val GlassBorder = Color.White.copy(alpha = 0.86f)

@Composable
fun StudentTheme(content: @Composable () -> Unit) = MaterialTheme(content = content)

fun Modifier.glassBubble(shape: RoundedCornerShape = RoundedCornerShape(28.dp)): Modifier =
    shadow(18.dp, shape, ambientColor = Color(0x220D1B37), spotColor = Color(0x220D1B37))
        .background(Glass, shape)
        .border(BorderStroke(1.dp, GlassBorder), shape)

@Composable
fun GlassPanel(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(18.dp),
    content: @Composable () -> Unit,
) {
    Surface(modifier = modifier.glassBubble(), color = Color.Transparent, contentColor = Ink, shape = RoundedCornerShape(28.dp)) {
        Column(Modifier.padding(contentPadding)) { content() }
    }
}

fun appBackground() = Brush.verticalGradient(listOf(Color(0xFFF7F8FF), Color(0xFFF0F5FF), Color(0xFFFFF7F1)))
