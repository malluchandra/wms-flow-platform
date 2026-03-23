package com.kinetic.wms.network

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStore @Inject constructor() {
    @Volatile
    var token: String? = null

    fun clear() {
        token = null
    }
}
