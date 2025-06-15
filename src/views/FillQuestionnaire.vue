<template>
  <div class="fill-questionnaire-container">
    <el-container>
      <el-main>
        <el-card v-if="questionnaire">
          <template #header>
            <div class="card-header">
              <h2>{{ questionnaire.title }}</h2>
            </div>
          </template>

          <el-form :model="answers" :rules="rules" ref="formRef">
            <div v-for="(question, index) in questionnaire.questions" :key="question.id" class="question-item">
              <h3>{{ index + 1 }}. {{ question.question_text }}</h3>
              
              <el-form-item :prop="question.id.toString()" :rules="[{ required: true, message: '请输入答案', trigger: 'blur' }]">
                <el-input 
                  v-model="answers[question.id]" 
                  type="textarea" 
                  :rows="3"
                  placeholder="请输入您的答案"
                />
              </el-form-item>
            </div>

            <el-form-item>
              <el-button type="primary" @click="submitAnswers" :loading="submitting">
                提交
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-empty v-else description="问卷不存在或已被删除" />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionnaires } from '../api'

export default {
  name: 'FillQuestionnaire',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const formRef = ref(null)
    const questionnaire = ref(null)
    const submitting = ref(false)
    const answers = reactive({})

    const rules = {
      // 动态规则会在模板中设置
    }

    const loadQuestionnaire = async () => {
      try {
        const response = await questionnaires.get(route.params.id)
        if (!response.data || !response.data.questionnaire) {
          ElMessage.error('问卷数据格式错误')
          return
        }
        questionnaire.value = response.data.questionnaire
        // 初始化答案对象
        questionnaire.value.questions.forEach(question => {
          answers[question.id] = ''
        })
      } catch (error) {
        console.error('加载问卷失败:', error)
        if (error.response?.status === 404) {
          ElMessage.error('问卷不存在或已被删除')
        } else {
          ElMessage.error(error.response?.data?.message || '加载问卷失败，请稍后重试')
        }
        router.push('/')
      }
    }

    const submitAnswers = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()
        submitting.value = true

        const formattedAnswers = Object.entries(answers).map(([questionId, text]) => ({
          questionId: parseInt(questionId),
          text: text.trim()
        }))

        await questionnaires.submit(route.params.id, { answers: formattedAnswers })
        ElMessage.success(`提交成功！提交时间：${new Date().toLocaleString()}`)
        router.push('/dashboard')
      } catch (error) {
        console.error('提交问卷失败:', error)
        if (error.response?.status === 404) {
          ElMessage.error('问卷不存在或已被删除')
        } else {
          ElMessage.error(error.response?.data?.message || '提交失败，请稍后重试')
        }
      } finally {
        submitting.value = false
      }
    }

    onMounted(() => {
      loadQuestionnaire()
    })

    return {
      questionnaire,
      answers,
      formRef,
      rules,
      submitting,
      submitAnswers
    }
  }
}
</script>

<style scoped>
.fill-questionnaire-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.el-main {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
}

.question-item {
  margin-bottom: 30px;
}

.question-item h3 {
  margin-bottom: 15px;
  color: #303133;
}
</style> 