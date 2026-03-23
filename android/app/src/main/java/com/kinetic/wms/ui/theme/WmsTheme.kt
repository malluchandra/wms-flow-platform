package com.kinetic.wms.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WarehouseLightScheme = lightColorScheme(
    primary = Color(0xFF1565C0),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFBBDEFB),
    secondary = Color(0xFF2E7D32),
    onSecondary = Color.White,
    error = Color(0xFFC62828),
    onError = Color.White,
    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF1A1A1A),
    surface = Color.White,
    onSurface = Color(0xFF1A1A1A),
    surfaceVariant = Color(0xFFE8E8E8),
    onSurfaceVariant = Color(0xFF666666),
)

@Composable
fun WmsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = WarehouseLightScheme,
        typography = Typography(),
        content = content,
    )
}
