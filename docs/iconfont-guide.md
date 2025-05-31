# 阿里巴巴图标库使用指南

本文档指导您如何在习惯打卡小程序中替换和使用阿里巴巴图标库（iconfont）。

## 步骤一：创建阿里巴巴图标库项目

1. 访问阿里巴巴图标库网站：https://www.iconfont.cn/
2. 注册并登录您的账号
3. 点击页面右上角的"图标管理" -> "我的项目" -> "新建项目"
4. 为项目命名（例如："习惯打卡小程序"）并创建

## 步骤二：添加图标到项目

1. 在阿里巴巴图标库网站上搜索您需要的图标
2. 将喜欢的图标添加到购物车
3. 点击页面右上角的购物车图标
4. 选择"添加到项目"，然后选择您刚创建的项目
5. 确保您至少添加了以下图标（与原项目匹配）：
   - 检查/打勾 (check)
   - 编辑 (edit)
   - 删除 (delete)
   - 详情 (detail)
   - 添加 (add/plus)
   - 习惯 (habit)
   - 分类 (category)
   - 排序 (sort)
   - 日历 (calendar)
   - 统计 (stats)
   - 用户 (user)
   - 首页 (home)
   - 社区 (community)
   - 打卡 (checkin)
   - 搜索 (search)
   - 通知 (notification)
   - 心形 (heart/heart-fill)
   - 评论 (comment)
   - 分享 (share)
   - 更多 (more)
   - 关闭 (close)
   - 图片 (image)
   - 标签 (tag)
   - 向右箭头 (right)
   - 空状态 (empty)
   - 排行榜 (ranking)

## 步骤三：下载图标库

1. 在"我的项目"页面，找到您的项目
2. 点击"下载至本地"
3. 在弹出的窗口中，选择"微信小程序"选项卡
4. 点击"下载代码"按钮

## 步骤四：替换项目中的图标文件

1. 将下载的压缩包解压
2. 将解压后的文件（通常包含 `iconfont.wxss`、`iconfont.wxml` 和其他文件）复制到项目的 `assets/fonts/iconfont` 目录中
3. 打开项目中的 `styles/iconfont.wxss` 文件
4. 将文件内容替换为以下内容：

```css
/**
 * 图标字体样式 - 引用阿里巴巴矢量图标库
 */
@import "/styles/iconfont.wxss";
```

## 步骤五：确保图标类名一致

1. 打开阿里巴巴图标库中的 `iconfont.wxss` 文件
2. 检查每个图标的类名（如 `.icon-check`）是否与项目中使用的一致
3. 如果不一致，您有两个选择：
   - 在阿里巴巴图标库网站上修改图标的名称，使其与项目一致，然后重新下载
   - 或者修改项目代码中使用的图标类名，使其与下载的图标一致

## 图标使用示例

在小程序的 WXML 文件中，这样使用图标：

```html
<text class="iconfont icon-check"></text>
```

如果需要设置图标大小和颜色，在 WXSS 中添加样式：

```css
.my-icon {
  font-size: 40rpx;
  color: #4F7CFF;
}
```

然后在 WXML 中使用：

```html
<text class="iconfont icon-check my-icon"></text>
```

## 常见问题

### 图标不显示？

1. 检查 `app.wxss` 中是否正确引入了 iconfont 样式文件
2. 确保类名使用正确（包含 `iconfont` 基础类和具体的图标类，如 `icon-check`）
3. 检查图标的 Unicode 编码是否与项目中使用的一致

### 想要添加新图标？

1. 回到阿里巴巴图标库网站，向您的项目添加新图标
2. 重新下载并替换项目中的图标文件
3. 使用新的图标类名在项目中引用图标

### 图标大小或颜色需要调整？

图标的大小通过 `font-size` 属性控制，颜色通过 `color` 属性控制：

```css
.custom-icon {
  font-size: 48rpx; /* 调整大小 */
  color: #FF0000; /* 调整颜色为红色 */
}
```

## 其他资源

- [阿里巴巴图标库官方文档](https://www.iconfont.cn/help/detail?helptype=code)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/) 
