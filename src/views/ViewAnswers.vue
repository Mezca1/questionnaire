<template>
  <div class="view-answers-container">
    <el-container>
      <el-main>
        <el-card v-if="questionnaire">
          <template #header>
            <div class="card-header">
              <h2>{{ questionnaire.title }} - 填写情况</h2>
            </div>
          </template>

          <div v-if="answers.length > 0">
            <div v-for="(submission, index) in answers" :key="index" class="submission-item">
              <el-card class="submission-card">
                <template #header>
                  <div class="submission-header">
                    <span>提交者：{{ submission.username }}</span>
                    <span class="submission-time">提交时间：{{ formatDate(submission.submittedAt) }}</span>
                  </div>
                </template>
                
                <div v-for="answer in submission.answers" :key="answer.questionId" class="answer-item">
                  <h4>{{ answer.questionText }}</h4>
                  <p class="answer-text">{{ answer.answerText }}</p>
                </div>
              </el-card>
            </div>
          </div>

          <el-empty v-else description="暂无填写记录" />
        </el-card>

        <el-empty v-else description="问卷不存在或已被删除" />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionnaires } from '../api'

export default {
  name: 'ViewAnswers',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const questionnaire = ref(null)
    const answers = ref([])

    const loadQuestionnaire = async () => {
      try {
        const response = await questionnaires.get(route.params.id)
        if (!response.data || !response.data.questionnaire) {
          ElMessage.error('问卷数据格式错误')
          return
        }
        questionnaire.value = response.data.questionnaire
      } catch (error) {
        console.error('加载问卷失败:', error)
        if (error.response?.status === 404) {
          ElMessage.error('问卷不存在或已被删除')
        } else {
          ElMessage.error(error.response?.data?.message || '加载问卷失败，请稍后重试')
        }
        router.push('/dashboard')
      }
    }

    const loadAnswers = async () => {
      try {
        const response = await questionnaires.getAnswers(route.params.id)
        if (!response.data || !response.data.answers) {
          ElMessage.error('答案数据格式错误')
          return
        }
        answers.value = response.data.answers
      } catch (error) {
        console.error('加载答案失败:', error)
        ElMessage.error(error.response?.data?.message || '加载答案失败，请稍后重试')
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '未知时间';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }

    onMounted(() => {
      loadQuestionnaire()
      loadAnswers()
    })

    return {
      questionnaire,
      answers,
      formatDate
    }
  }
}
</script>

<style scoped>
.view-answers-container {
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

.submission-item {
  margin-bottom: 20px;
}

.submission-card {
  margin-bottom: 20px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submission-time {
  color: #909399;
  font-size: 0.9em;
}

.answer-item {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.answer-item h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.answer-text {
  margin: 0;
  color: #606266;
  white-space: pre-wrap;
}
</style> 