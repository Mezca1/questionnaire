<template>
  <div class="dashboard-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>问卷系统</h2>
          <div class="header-buttons">
            <el-button type="primary" @click="createQuestionnaire">创建问卷</el-button>
            <el-button @click="viewMyAnswers">我填写的问卷</el-button>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>我的问卷</span>
                </div>
              </template>
              
              <el-table :data="questionnaireList" style="width: 100%">
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="created_at" label="创建时间">
                  <template #default="scope">
                    {{ new Date(scope.row.created_at).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="300">
                  <template #default="scope">
                    <el-button
                      size="small"
                      @click="viewQuestionnaire(scope.row.id)"
                    >
                      查看
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      @click="viewAnswers(scope.row.id)"
                    >
                      查看填写情况
                    </el-button>
                    <el-button
                      size="small"
                      type="success"
                      @click="shareQuestionnaire(scope.row.id)"
                    >
                      分享
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <!-- 创建问卷对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建问卷"
      width="50%"
    >
      <el-form :model="questionnaireForm" :rules="rules" ref="questionnaireFormRef">
        <el-form-item label="问卷标题" prop="title">
          <el-input v-model="questionnaireForm.title" />
        </el-form-item>
        
        <el-form-item label="问题列表">
          <div class="questions-container">
            <div v-for="(question, index) in questionnaireForm.questions" :key="index" class="question-item">
              <el-row :gutter="20">
                <el-col :span="20">
                  <el-input v-model="question.text" placeholder="请输入问题内容" />
                </el-col>
                <el-col :span="4">
                  <el-button type="danger" @click="removeQuestion(index)">删除</el-button>
                </el-col>
              </el-row>
            </div>
            <div class="add-question-wrapper">
              <el-button 
                type="primary" 
                @click="addQuestion"
                class="add-question-btn"
                :icon="Plus"
              >
                添加问题
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuestionnaire">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享问卷"
      width="30%"
    >
      <el-input
        v-model="shareUrl"
        readonly
      >
        <template #append>
          <el-button @click="copyShareUrl">复制</el-button>
        </template>
      </el-input>
    </el-dialog>

    <!-- 查看填写情况对话框 -->
    <el-dialog
      v-model="answersDialogVisible"
      title="问卷填写情况"
      width="70%"
    >
      <div v-if="currentAnswers.length > 0">
        <div v-for="(answerGroup, index) in currentAnswers" :key="index" class="answer-group">
          <h3>{{ answerGroup.username }} - {{ new Date(answerGroup.submittedAt).toLocaleString() }}</h3>
          <el-card v-for="answer in answerGroup.answers" :key="answer.questionId" class="answer-item">
            <div class="question-text">{{ answer.questionText }}</div>
            <div class="answer-text">{{ answer.answerText }}</div>
          </el-card>
        </div>
      </div>
      <el-empty v-else description="暂无填写记录" />
    </el-dialog>

    <!-- 我填写的问卷对话框 -->
    <el-dialog
      v-model="myAnswersDialogVisible"
      title="我填写的问卷"
      width="70%"
    >
      <el-table :data="myAnsweredQuestionnaires" style="width: 100%">
        <el-table-column prop="title" label="问卷标题" />
        <el-table-column prop="creator_name" label="创建者" />
        <el-table-column prop="answered_at" label="填写时间">
          <template #default="scope">
            {{ new Date(scope.row.answered_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button
              size="small"
              @click="viewQuestionnaire(scope.row.id)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionnaires } from '../api'
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'DashboardPage',
  setup() {
    const router = useRouter()
    const questionnaireFormRef = ref(null)
    const dialogVisible = ref(false)
    const shareDialogVisible = ref(false)
    const answersDialogVisible = ref(false)
    const myAnswersDialogVisible = ref(false)
    const shareUrl = ref('')
    const questionnaireList = ref([])
    const currentAnswers = ref([])
    const myAnsweredQuestionnaires = ref([])

    const questionnaireForm = reactive({
      title: '',
      questions: []
    })

    const rules = {
      title: [
        { required: true, message: '请输入问卷标题', trigger: 'blur' }
      ]
    }

    const loadQuestionnaires = async () => {
      try {
        const response = await questionnaires.list()
        questionnaireList.value = Array.isArray(response.data.questionnaires) 
          ? response.data.questionnaires 
          : []
      } catch (error) {
        console.error('加载问卷列表错误:', error)
        ElMessage.error('加载问卷列表失败')
        questionnaireList.value = []
      }
    }

    const createQuestionnaire = () => {
      questionnaireForm.title = ''
      questionnaireForm.questions = []
      dialogVisible.value = true
    }

    const addQuestion = () => {
      questionnaireForm.questions.push({
        text: '',
        type: 'text'
      })
    }

    const removeQuestion = (index) => {
      questionnaireForm.questions.splice(index, 1)
    }

    const submitQuestionnaire = async () => {
      if (!questionnaireFormRef.value) return
      
      await questionnaireFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            // 验证问题列表
            if (questionnaireForm.questions.length === 0) {
              ElMessage.warning('请至少添加一个问题')
              return
            }

            // 验证每个问题
            for (const question of questionnaireForm.questions) {
              if (!question.text.trim()) {
                ElMessage.warning('问题内容不能为空')
                return
              }
            }

            await questionnaires.create(questionnaireForm)
            ElMessage.success('问卷创建成功')
            dialogVisible.value = false
            loadQuestionnaires()
          } catch (error) {
            console.error('创建问卷错误:', error)
            ElMessage.error(error.response?.data?.message || '创建问卷失败')
          }
        }
      })
    }

    const viewQuestionnaire = (id) => {
      router.push(`/questionnaire/${id}`)
    }

    const shareQuestionnaire = (id) => {
      shareUrl.value = `${window.location.origin}/questionnaire/${id}`
      shareDialogVisible.value = true
    }

    const copyShareUrl = () => {
      navigator.clipboard.writeText(shareUrl.value)
        .then(() => ElMessage.success('链接已复制'))
        .catch(() => ElMessage.error('复制失败'))
    }

    const viewAnswers = async (id) => {
      try {
        const response = await questionnaires.getAnswers(id)
        currentAnswers.value = response.data.answers
        answersDialogVisible.value = true
      } catch (error) {
        console.error('获取问卷填写情况错误:', error)
        ElMessage.error(error.response?.data?.message || '获取问卷填写情况失败')
      }
    }

    const viewMyAnswers = async () => {
      try {
        const response = await questionnaires.getMyAnswers()
        myAnsweredQuestionnaires.value = response.data.questionnaires
        myAnswersDialogVisible.value = true
      } catch (error) {
        console.error('获取我填写的问卷错误:', error)
        ElMessage.error(error.response?.data?.message || '获取我填写的问卷失败')
      }
    }

    onMounted(() => {
      loadQuestionnaires()
    })

    return {
      questionnaireList,
      dialogVisible,
      shareDialogVisible,
      answersDialogVisible,
      myAnswersDialogVisible,
      shareUrl,
      currentAnswers,
      myAnsweredQuestionnaires,
      questionnaireForm,
      questionnaireFormRef,
      rules,
      createQuestionnaire,
      addQuestion,
      removeQuestion,
      submitQuestionnaire,
      viewQuestionnaire,
      shareQuestionnaire,
      copyShareUrl,
      viewAnswers,
      viewMyAnswers,
      Plus
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.el-main {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.questions-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.question-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.add-question-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #dcdfe6;
}

.add-question-btn {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.add-question-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.answer-group {
  margin-bottom: 30px;
}

.answer-group h3 {
  margin-bottom: 15px;
  color: #303133;
}

.answer-item {
  margin-bottom: 15px;
}

.question-text {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.answer-text {
  color: #606266;
  white-space: pre-wrap;
}
</style> 