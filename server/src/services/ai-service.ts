/**
 * AI 服务 - 集成 DeepSeek API 实现简历解析与智能填写
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface ParseResult {
  name: string;
  phone: string;
  email: string;
  education: Array<{
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    role: string;
    description: string;
    techStack: string;
  }>;
  skills: string[];
  certifications: string[];
  summary: string;
  [key: string]: unknown;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeek(
  systemPrompt: string,
  userMessage: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      stream: false
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API 错误 [${response.status}]: ${errBody}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || '';
}

/**
 * 解析简历文本为结构化数据
 */
export async function parseResume(resumeText: string): Promise<ParseResult> {
  const systemPrompt = `你是一个专业的简历解析助手。你需要从用户提供的简历文本中提取结构化信息。
请严格按照以下 JSON 格式返回结果，不要包含任何其他文字：

{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "education": [
    { "school": "学校名", "degree": "学历", "major": "专业", "startDate": "开始时间", "endDate": "结束时间" }
  ],
  "workExperience": [
    { "company": "公司名", "position": "职位", "startDate": "开始时间", "endDate": "结束时间", "description": "工作描述" }
  ],
  "projects": [
    { "name": "项目名", "role": "角色", "description": "项目描述", "techStack": "技术栈" }
  ],
  "skills": ["技能1", "技能2"],
  "certifications": ["证书1"],
  "summary": "个人总结/求职意向"
}

注意：
- 如果某个字段在简历中不存在，请使用空字符串或空数组
- 时间格式统一为 "YYYY年MM月" 或 "YYYY-MM"
- 保持原简历中的信息准确性，不要编造`;

  const result = await callDeepSeek(systemPrompt, `请解析以下简历文本：\n\n${resumeText}`);
  
  try {
    // 尝试从返回中提取 JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ParseResult;
    }
    return JSON.parse(result) as ParseResult;
  } catch {
    throw new Error('AI 解析返回格式异常，请重试');
  }
}

/**
 * 针对目标岗位优化简历
 */
export async function optimizeResume(
  resumeText: string,
  companyName: string,
  positionName: string
): Promise<string> {
  const systemPrompt = `你是一个简历优化专家。根据目标公司和岗位，针对性优化简历内容。
请保持简历的基本结构和事实不变，突出与目标岗位相关的经验和技能。
使用 Markdown 格式输出优化后的完整简历。`;

  const userMessage = `原始简历：\n${resumeText}\n\n目标公司：${companyName}\n目标岗位：${positionName}\n\n请针对该岗位优化简历，突出相关经验。`;

  return callDeepSeek(systemPrompt, userMessage, { temperature: 0.5, maxTokens: 4096 });
}

/**
 * 智能匹配表单字段并生成填充值
 */
export async function generateFieldValues(
  resumeData: ParseResult,
  formFields: Array<{ name: string; label: string; type: string; required: boolean }>,
  smartMemory: Record<string, string>
): Promise<Record<string, string>> {
  const systemPrompt = `你是一个智能表单填写助手。根据简历数据和历史记忆，为表单字段生成最合适的值。
返回 JSON 格式：{ "字段名": "填充值" }。

规则：
1. 优先使用简历中已有的精确匹配信息
2. 对于简历中没有的字段，检查历史记忆中有无对应值
3. 对于需要推断的字段（如"期望薪资"），可根据岗位和市场水平合理推断
4. 不要编造简历中完全没有的信息（除非历史记忆中有）
5. 手机号、邮箱等关键信息必须精确匹配`;

  const fieldsInfo = JSON.stringify(formFields, null, 2);
  const memoryInfo = JSON.stringify(smartMemory, null, 2);
  const resumeInfo = JSON.stringify(resumeData, null, 2);

  const userMessage = `简历数据：\n${resumeInfo}\n\n历史记忆：\n${memoryInfo}\n\n表单字段：\n${fieldsInfo}\n\n请为每个字段生成填充值。`;

  const result = await callDeepSeek(systemPrompt, userMessage, { temperature: 0.2 });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, string>;
    }
    return JSON.parse(result) as Record<string, string>;
  } catch {
    throw new Error('字段匹配失败，请重试');
  }
}

/**
 * 分析公司招聘页面表单结构（供扩展使用）
 */
export async function analyzeFormStructure(
  pageHtml: string,
  pageUrl: string
): Promise<Array<{ name: string; label: string; type: string; selector: string; required: boolean }>> {
  const systemPrompt = `你是一个网页表单分析专家。分析招聘页面的 HTML，提取所有简历相关的表单字段。
返回 JSON 数组格式：
[
  {
    "name": "字段的 name 属性",
    "label": "字段的标签文本",
    "type": "字段类型 (text/email/tel/select/textarea/date/file)",
    "selector": "唯一 CSS 选择器",
    "required": true
  }
]

只提取与简历填写相关的字段（如姓名、手机、邮箱、教育经历、工作经历等）。
忽略搜索框、登录框等非简历字段。`;

  const userMessage = `页面URL：${pageUrl}\n\n页面HTML关键部分：\n${pageHtml.slice(0, 10000)}\n\n请分析表单结构。`;

  const result = await callDeepSeek(systemPrompt, userMessage, { temperature: 0.1 });

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Array<{
        name: string; label: string; type: string; selector: string; required: boolean
      }>;
    }
    return JSON.parse(result) as Array<{
      name: string; label: string; type: string; selector: string; required: boolean
    }>;
  } catch {
    // 降级：返回空数组
    return [];
  }
}