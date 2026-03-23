package com.kinetic.wms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.kinetic.wms.navigation.WmsNavGraph
import com.kinetic.wms.ui.theme.WmsTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WmsTheme {
                WmsNavGraph()
            }
        }
    }
}
