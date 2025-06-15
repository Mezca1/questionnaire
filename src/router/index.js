import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/questionnaire/:id',
    name: 'FillQuestionnaire',
    component: () => import('../views/FillQuestionnaire.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // 需要登录的路由
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  // 已登录用户不能访问登录/注册页
  if (to.meta.requiresGuest && token) {
    next('/dashboard')
    return
  }

  // 检查token是否过期
  if (token && user) {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      if (tokenData.exp * 1000 < Date.now()) {
        // token已过期，清除登录状态
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (to.meta.requiresAuth) {
          next('/login')
          return
        }
      }
    } catch (error) {
      console.error('Token解析错误:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (to.meta.requiresAuth) {
        next('/login')
        return
      }
    }
  }

  next()
})

export default router 