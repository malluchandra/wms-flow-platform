package com.kinetic.wms.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.kinetic.wms.ui.flow.FlowExecutionScreen
import com.kinetic.wms.ui.login.LoginScreen
import com.kinetic.wms.ui.tasks.TaskListScreen

object Routes {
    const val LOGIN = "login"
    const val TASK_LIST = "tasks/{workerId}"
    const val FLOW_EXECUTION = "flow/{taskId}/{flowName}"
    const val FLOW_RESUME = "flow/resume/{sessionId}/{flowId}"

    fun taskList(workerId: String) = "tasks/$workerId"
    fun flowExecution(taskId: String, flowName: String) = "flow/$taskId/$flowName"
    fun flowResume(sessionId: String, flowId: String) = "flow/resume/$sessionId/$flowId"
}

@Composable
fun WmsNavGraph() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = { workerId ->
                    navController.navigate(Routes.taskList(workerId)) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }

        composable(
            route = Routes.TASK_LIST,
            arguments = listOf(navArgument("workerId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val workerId = backStackEntry.arguments?.getString("workerId") ?: return@composable
            TaskListScreen(
                workerId = workerId,
                onTaskSelected = { taskId, flowName ->
                    navController.navigate(Routes.flowExecution(taskId, flowName))
                },
                onResumeSession = { sessionId, flowId ->
                    navController.navigate(Routes.flowResume(sessionId, flowId))
                },
            )
        }

        composable(
            route = Routes.FLOW_EXECUTION,
            arguments = listOf(
                navArgument("taskId") { type = NavType.StringType },
                navArgument("flowName") { type = NavType.StringType },
            ),
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId") ?: return@composable
            val flowName = backStackEntry.arguments?.getString("flowName") ?: return@composable
            FlowExecutionScreen(
                taskId = taskId,
                flowName = flowName,
                onFlowComplete = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.FLOW_RESUME,
            arguments = listOf(
                navArgument("sessionId") { type = NavType.StringType },
                navArgument("flowId") { type = NavType.StringType },
            ),
        ) { backStackEntry ->
            val sessionId = backStackEntry.arguments?.getString("sessionId") ?: return@composable
            val flowId = backStackEntry.arguments?.getString("flowId") ?: return@composable
            FlowExecutionScreen(
                taskId = "",
                flowName = flowId,
                resumeSessionId = sessionId,
                onFlowComplete = { navController.popBackStack() },
            )
        }
    }
}
