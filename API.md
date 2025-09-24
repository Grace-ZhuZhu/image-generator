### Rest API 调用示例
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "Generate 3 images of a girl and a cow plushie happily riding a roller coaster in an amusement park, depicting morning, noon, and night.",
    "image": ["https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimages_1.png", "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimages_2.png"],
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
        "max_images": 3
    },
    "response_format": "url",
    "size": "2K",
    "stream": true,
    "watermark": true
}'

#### 输入
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬",
    "size": "2K",
    "sequential_image_generation": "disabled",
    "stream": false,
    "response_format": "url",
    "watermark": true
}'

#### 输出
{
    "model": "doubao-seedream-4-0-250828",
    "created": 1757321139,
    "data": [
        {
            "url": "https://...",
            "size": "3104x1312"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": xxx,
        "total_tokens": xxx
    }
}

### Python SDK 调用示例
pip install --upgrade "volcengine-python-sdk[ark]"

import os 
from volcenginesdkarkruntime import Ark 
from volcenginesdkarkruntime.types.images.images import SequentialImageGenerationOptions

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中 
# 初始化Ark客户端，从环境变量中读取您的API Key 
client = Ark( 
    base_url="https://ark.cn-beijing.volces.com/api/v3", 
    api_key=os.environ.get("ARK_API_KEY"), 
) 
 
imagesResponse = client.images.generate( 
    model="doubao-seedream-4-0-250828", 
    prompt="生成3张女孩和奶牛玩偶在游乐园开心地坐过山车的图片，涵盖早晨、中午、晚上",
    image=["https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_1.png", "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_2.png"],
    size="2K",
    sequential_image_generation="auto",
    sequential_image_generation_options=SequentialImageGenerationOptions(max_images=3),
    response_format="url",
    watermark=True
) 
 
# 遍历所有图片数据
for image in imagesResponse.data:
    # 输出当前图片的url和size
    print(f"URL: {image.url}, Size: {image.size}")


# 图片生成 API（Seedream 4.0 API）
- **发布时间**：2025-06-23 15:41:28
- **请求地址**：POST https://ark.cn-beijing.volces.com/api/v3/images/generations
- **文档说明**：本文介绍图片生成模型调用 API 的输入输出参数，供使用接口时查阅字段含义。


## 一、请求参数
请求参数通过请求体传递，具体字段说明如下：

| 参数名 | 类型 | 是否必选 | 默认值 | 取值范围/选项 | 说明 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| prompt | string | 必选 | - | - | 用于生成图像的提示词，是模型生成图像的核心依据 |
| model | string | 必选 | - | 仅支持 doubao-seedream-3-0-t2i-250415 | 本次请求使用模型的 Model ID 或推理接入点 (Endpoint ID) |
| response_format | string | 可选 | url | 可选值：<br>- "url"：以可下载的 JPEG 图片链接形式返回<br>- "b64_json"：以 Base64 编码字符串的 JSON 格式返回图像数据 | 指定生成图像的返回格式 |
| size | string | 可选 | 1024x1024 | 要求介于 [512 x 512, 2048 x 2048] 之间，推荐可选宽高：<br>1024x1024（1:1）、864x1152（3:4）、1152x864（4:3）、1280x720（16:9）、720x1280（9:16）、832x1248（2:3）、1248x832（3:2）、1512x648（21:9） | 生成图像的宽高像素 |
| seed | integer | 可选 | -1 | [-1, 2147483647] | 随机数种子，用于控制模型生成内容的随机性：<br>- 不提供时，算法自动生成随机数作为种子<br>- 需生成内容保持一致时，可使用相同 seed 值 |
| guidance_scale | Float | 可选 | 2.5 | [1, 10] 之间的浮点数 | 模型输出结果与 prompt 的一致程度（生成图像的自由度）：<br>- 值越大，模型自由度越小，与提示词相关性越强 |
| watermark | Boolean | 可选 | true | 可选值：<br>- false：不添加水印<br>- true：在图片右下角添加“AI生成”字样的水印标识 | 是否在生成的图片中添加水印 |


## 二、响应参数
响应结果包含模型信息、创建时间、图像数据、用量统计及错误信息（若有），具体字段说明如下：

| 参数名 | 类型 | 子字段（如有） | 说明 |
| ---- | ---- | ---- | ---- |
| model | string | - | 本次请求使用的模型 ID（格式：模型名称-版本） |
| created | integer | - | 本次请求创建时间的 Unix 时间戳（单位：秒） |
| data | list | - | 输出图像的信息，子字段随 `response_format` 变化：<br>- 当 `response_format="url"` 时，子字段为 `url`（图片下载链接，生成后24小时内失效，需及时保存）<br>- 当 `response_format="b64_json"` 时，子字段为 `b64_json`（Base64 编码的图像数据） |
| usage | Object | generated_images | 模型生成的图片张数（计费依据） |
| | | output_tokens | 模型生成图片所用的 Token 数量，计算公式：`长×宽/256`（四舍五入取整） |
| | | total_tokens | 本次请求消耗的总 Token 数量（因输入不计算 Token，故与 `output_tokens` 一致） |
| error | Object | code | 错误码（仅请求失败时返回） |
| | | message | 错误提示信息（仅请求失败时返回） |


## 三、其他说明
- **计费规则**：图片生成模型按照生成的图片张数（即 `usage.generated_images` 字段值）进行计费。
- **链接有效期**：当 `response_format` 为 `url` 时，返回的图片下载链接仅在生成后24小时内有效，需及时保存图像，避免链接失效导致无法获取图片。
- **模型限制**：目前仅支持指定模型 `doubao-seedream-3-0-t2i-250415`，暂不支持其他模型 ID 或接入点。


POST https://ark.cn-beijing.volces.com/api/v3/images/generations [运行](https://api.volcengine.com/api-explorer/?action=ImageGenerations&amp;groupName=%E5%9B%BE%E7%89%87%E7%94%9F%E6%88%90API&amp;serviceCode=ark&amp;version=2024-01-01&amp;tab=2#N4IgTgpgzgDg9gOyhA+gMzmAtgQwC4gBcIArmADYgA0IUAlgF4REgBMA0tSAO74TY4wAayJoc5ZDSxwAJhErEZcEgCMccALTIIMyDiwaALBoAMG1gFYTADlbWuMMHCwwCxQPhmgUTTA-l6Ao2MAw-4CLeYB4tkHBgDOJgE2KgF+KgABygGHxgNf6gPSmgN2egCwegHEegCFugLCagCfKgOhKgGbx-oBFRoBjkYCTkZGA34qA2Ur+gKyugI76gOSagOJO-oDU5oCnpoBHphWA+Ib+gBVKI4Cf2oAr1oBOQf5wAMaATHaAy+b+gJKKgP1+gL-xgFRxY4CABoCEVoBTPv6A9maAj7b+gKGxgA3OgHnagNxygJJy-peAuyH+gNyugEbpgFgJgHH4wBjfoBvQOygAY5QAz2tkZoBLfUAQjqAQmtAIoagAIEp6AZXlAHBygC51c7+QAUsUNAPjuD38gHSzQKAOYzADMB52y6xagAlTQA55oBSELR0UA2DaAF7V-IAXU0xgB9FQDuioAvIMA9OaAbz1AM8GI0AHJqAAn1soB-PUAS5GAeASKmz-IAAAPW-kAs8qAEB1-IBA80AL4GMlr+QBc+oBUfUagDwVQA2aiAAL5AA)​
本文介绍图片生成模型如 Seedream 4.0 的调用 API ，包括输入输出参数，取值范围，注意事项等信息，供您使用接口时查阅字段含义。


快速入口
请求参数
请求体

model string 必选
本次请求使用模型的 [Model ID](https://www.volcengine.com/docs/82379/1513689) 或[推理接入点](https://www.volcengine.com/docs/82379/1099522) (Endpoint ID)。​

prompt string 必选
用于生成图像的提示词，支持中英文。
建议不超过300个汉字或600个英文单词。字数过多信息容易分散，模型可能因此忽略细节，只关注重点，造成图片缺失部分元素。

image string/array 可选
仅 doubao-seedream-4.0、doubao-seededit-3.0-i2i 支持该参数

输入的图片信息，支持 URL 或 Base64 编码。其中，doubao-seedream-4.0 支持单图或多图输入（[查看多图融合示例](https://www.volcengine.com/docs/82379/1824121#%E5%A4%9A%E5%9B%BE%E8%9E%8D%E5%90%88%EF%BC%88%E5%A4%9A%E5%9B%BE%E8%BE%93%E5%85%A5%E5%8D%95%E5%9B%BE%E8%BE%93%E5%87%BA%EF%BC%89)），doubao-seededit-3.0-i2 仅支持单图输入。​
* 图片URL：请确保图片URL可被访问。

* Base64编码：请遵循此格式data:image/<图片格式>;base64,<Base64编码>。注意 <图片格式> 需小写，如 data:image/png;base64,<base64_image>。

说明
* 传入图片需要满足以下条件：

* 图片格式：jpeg、png

* 宽高比（宽/高）范围：[1/3, 3]

* 宽高长度（px） > 14

* 大小：不超过 10MB

* 总像素：不超过 6000×6000 px

* doubao-seedream-4.0 最多支持传入 10 张参考图。

size  string 可选
doubao-seedream-4.0
doubao-seedream-3.0-t2i
doubao-seededit-3.0-i2i

指定生成图像的尺寸信息，支持以下两种方式，不可混用。
* 方式1 | [示例](https://www.volcengine.com/docs/82379/1824121#%E6%8C%87%E5%AE%9A%E5%9B%BE%E5%83%8F%E5%88%86%E8%BE%A8%E7%8E%87)：指定生成图像的分辨率，并在prompt中用自然语言描述图片宽高比、图片形状或图片用途，最终由模型判断生成图片的大小。

* 可选值：1K、2K、4K

* 方式2 | [示例](https://www.volcengine.com/docs/82379/1824121#%E6%8C%87%E5%AE%9A%E5%9B%BE%E5%83%8F%E5%AE%BD%E9%AB%98%E5%83%8F%E7%B4%A0%E5%80%BC)：指定生成图像的宽高像素值：

* 默认值：2048x2048

* 总像素取值范围：[1280x720, 4096x4096]

* 宽高比取值范围：[1/16, 16]

推荐的宽高像素值：
| 宽高比​ | 宽高像素值​ |
|---|---|
| 1:1​ | 2048x2048​ |
| 4:3​ | 2304x1728​ |
| 3:4​ | 1728x2304​ |
| 16:9​ | 2560x1440​ |
| 9:16​ | 1440x2560​ |
| 3:2​ | 2496x1664​ |
| 2:3​ | 1664x2496​ |
| 21:9​ | 3024x1296​ |

seed integer 可选 默认值 -1
仅doubao-seedream-3.0-t2i、doubao-seededit-3.0-i2i支持该参数

随机数种子，用于控制模型生成内容的随机性。取值范围为 [-1, 2147483647]。
注意
* 相同的请求下，模型收到不同的seed值，如：不指定seed值或令seed取值为-1（会使用随机数替代）、或手动变更seed值，将生成不同的结果。

* 相同的请求下，模型收到相同的seed值，会生成类似的结果，但不保证完全一致。

sequential_image_generation string 可选 默认值 disabled
仅doubao-seedream-4.0支持该参数 | [查看组图输出示例](https://www.volcengine.com/docs/82379/1824121#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)​

控制是否关闭组图功能。
说明
组图：基于您输入的内容，生成的一组内容关联的图片。

取值范围：
* auto：自动判断模式，模型会根据用户提供的提示词自主判断是否返回组图以及组图包含的图片数量。

* disabled：关闭组图功能，模型只会生成一张图。

sequential_image_generation_options object 可选
仅doubao-seedream-4.0支持该参数

组图功能的配置。仅当sequential_image_generation为auto时生效。

属性

sequential_image_generation_options.max_images  integer 可选 默认值 15
指定本次请求，最多可生成的图片数量。
* 取值范围： [1, 15]

说明
实际可生成的图片数量，除受到 max_images 影响外，还受到输入的参考图数量影响。输入的参考图数量+最终生成的图片数量≤15张。

stream  Boolean 可选 默认值 false
仅doubao-seedream-4.0支持该参数 | [查看流式输出示例](https://www.volcengine.com/docs/82379/1824121#%E6%B5%81%E5%BC%8F%E8%BE%93%E5%87%BA)​

控制是否开启流式输出模式。
* false：非流式输出模式，等待所有图片全部生成结束后再一次性返回所有信息。

* true：流式输出模式，即时返回每张图片输出的结果。在生成单图和组图的场景下，流式输出模式均生效。

guidance_scale  Float 可选
doubao-seedream-3.0-t2i 默认值 2.5
doubao-seededit-3.0-i2i 默认值 5.5
doubao-seedream-4.0 不支持

模型输出结果与prompt的一致程度，即生成图像的自由度；值越大，模型自由度越小，与用户输入的提示词相关性越强。
取值范围：[1, 10] 。

response_format string 可选 默认值 url
指定生成图像的返回格式。
生成的图片为 jpeg 格式，支持以下两种返回方式：
* url：返回图片下载链接；链接在图片生成后24小时内有效，请及时下载图片。

* b64_json：以 Base64 编码字符串的 JSON 格式返回图像数据。

watermark Boolean 可选 默认值 true
是否在生成的图片中添加水印。
* false：不添加水印。

* true：在图片右下角添加“AI生成”字样的水印标识。

响应参数
流式响应参数
请参见[文档](https://www.volcengine.com/docs/82379/1824137?lang=zh)。​

非流式响应参数

model string
本次请求使用的模型 ID （模型名称-版本）。

created integer
本次请求创建时间的 Unix 时间戳（秒）。

data array
输出图像的信息。
说明
doubao-seedream-4.0模型生成组图场景下，组图生成过程中某张图生成失败时：
* 若失败原因为审核不通过：仍会继续请求下一个图片生成任务，即不影响同请求内其他图片的生成流程。

* 若失败原因为内部服务异常（500）：不会继续请求下一个图片生成任务。

可能类型
图片信息 object
生成成功的图片信息。

属性
data.url string
图片的 url 信息，当 response_format 指定为 url 时返回。该链接将在生成后 24 小时内失效，请务必及时保存图像。

data.b64_json string
图片的 base64 信息，当 response_format 指定为 b64_json 时返回。

data.size string
仅 doubao-seedream-4.0 支持该字段。

图像的宽高像素值，格式<宽像素>x<高像素>，如2048×2048。

错误信息 object
某张图片生成失败，错误信息。

属性
data.error object
错误信息结构体。

属性

data.error.code
某张图片生成错误的错误码，请参见[错误码](https://www.volcengine.com/docs/82379/1299023)。​

data.error.message
某张图片生成错误的提示信息。

usage object
本次请求的用量信息。

属性

usage.generated_images integer
模型成功生成的图片张数，不包含生成失败的图片。
仅对成功生成图片按张数进行计费。

usage.output_tokens integer
模型生成的图片花费的 token 数量。
计算逻辑为：计算sum(图片长*图片宽)/256 ，然后取整。

usage.total_tokens integer
本次请求消耗的总 token 数量。
当前不计算输入 token，故与 output_tokens 值一致。

error object
本次请求，如发生错误，对应的错误信息。

属性

error.code string
请参见[错误码](https://www.volcengine.com/docs/82379/1299023)。​

error.message string
错误提示信息

doubao-seedream-4.0-文生图
doubao-seedream-4.0-图生图
doubao-seedream-4.0-多图融合
doubao-seedream-4.0-多参考图生组图
doubao-seedream-4.0-流式输出
doubao-seedream-3.0-t2i
doubao-seededit-3.0-i2i


## 流式响应

doubao-seedream-4.0 支持流式输出模式。当您调用图片生成API 并将 stream 设置为 true 时，服务器会在生成响应的过程中，通过 Server-Sent Events（SSE）实时向客户端推送事件。本节内容介绍服务器会推送的各类事件。
image_generation.partial_succeeded
当前仅 doubao-seedream-4.0 支持流式响应。

在流式响应模式下，当任意图片生成成功时返回该事件。

参数说明
type string
此处应为 image_generation.partial_succeeded。

model string
本次请求使用的模型 ID ，格式为<模型名称>-<版本>。

created integer
本次请求创建时间的 Unix 时间戳（秒）。

image_index integer
本次生图请求中，本次事件对应图片在请求中的序号。
从 0开始累加，不管生图是否成功，即在 image_generation.partial_succeeded、image_generation.partial_failed 事件，均会自动累加 1。

url string
本次事件对应图片的下载 URL。当请求中配置字段 response_format 为 url 时返回。

b64_json string
本次事件对应图片的 Base64 编码。当请求中配置字段 response_format 为 b64_json 时返回。

size string
图像的宽高像素值，格式<宽像素>×<高像素>，如 2048×2048。

返回示例
Shell

复制

{

"type": "image_generation.partial_succeeded",

"model": "doubao-seedream-4-0-250828",

"created": 1589478378,

"image_index": 0,

"url": "https://...",

"size": "2048×2048"

}

image_generation.partial_failed
当前仅 doubao-seedream-4.0 支持流式响应。

在流式返回模式下，当任意图片生成失败时返回该事件。
* 若失败原因为审核不通过：仍会继续请求下一个图片生成任务，即不影响同请求内其他图片的生成流程。

* 若失败原因为内部服务异常（500）：不会继续请求下一个图片生成任务。

参数说明
type string
此处应为 image_generation.partial_failed。

model string
本次请求使用的模型 ID ，格式为<模型名称>-<版本>。

created integer
本次请求创建时间的 Unix 时间戳（秒）。

image_index integer
本次生图请求中，本次事件对应图片在请求中的序号。
从 0开始累加，不管图片是否生成成功，即在image_generation.partial_succeeded、image_generation.partial_failed 事件，均会自动累加 1。

error object
本次生图请求中，本次事件对应的错误原因。

属性

error.code string
请参见[错误码](https://www.volcengine.com/docs/82379/1299023)。​

error.message string
错误提示信息

返回示例
Shell

复制

{

"type": "image_generation.partial_failed",

"model": "doubao-seedream-4-0-250828",

"created": 1589478378,

"image_index": 2,

"error": {

"code":"OutputImageSensitiveContentDetected"，

"message":"The request failed because the output image may contain sensitive information."

}

}

image_generation.completed
当前仅 doubao-seedream-4.0 支持流式响应。

请求的所有图片（无论成功或失败）均处理完毕后返回，是该流式返回的最后一个响应事件。

参数说明
type string
此处应为 image_generation.completed。

model string
本次请求使用的模型 ID ，格式为<模型名称>-<版本>。

created integer
本次请求创建时间的 Unix 时间戳（秒）。

usage Object
本次请求的用量信息。

属性

usage.generated_images integer
模型成功生成的图片张数，不包含生成失败的图片。
仅对成功生成图片按张数进行计费。

usage.output_tokens integer
模型生成的图片花费的 token 数量。
计算逻辑为：计算sum(图片长*图片宽)/256 ，然后取整。

usage.total_tokens integer
本次请求消耗的总 token 数量。
当前不计算输入 token，故与 output_tokens 值一致。

返回示例
Shell

复制

{

"type": "image_generation.completed",

"model": "doubao-seedream-4-0-250828",

"created": 1589478378,

"usage": {

"generated_images": 2,

"output_tokens": xx,

"total_tokens": xx,

}

}

error
本次请求如发生错误，对应的错误信息。

参数说明
error object
本次请求错误，返回的错误信息。

属性

error.code string
请参见[错误码](https://www.volcengine.com/docs/82379/1299023)。​

error.message string
错误提示信息。

返回示例
Shell

复制

"error": {

"code":"BadRequest"，

"message":"The request failed because it is missing one or multiple required parameters. Request ID: {id}"

}

doubao-seedream-4.0-文生图
doubao-seedream-4.0-图生图
doubao-seedream-4.0-多图融合
doubao-seedream-4.0-多参考图生组图
doubao-seedream-4.0-流式输出
doubao-seedream-3.0-t2i
doubao-seededit-3.0-i2i

输入示例

Curl

```
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬",
    "size": "2K",
    "sequential_image_generation": "disabled",
    "stream": false,
    "response_format": "url",
    "watermark": true
}'
```

输出示例

Curl

```
{
    "model": "doubao-seedream-4-0-250828",
    "created": 1757321139,
    "data": [
        {
            "url": "https://...",
            "size": "3104x1312"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": xxx,
        "total_tokens": xxx
    }
}
```
