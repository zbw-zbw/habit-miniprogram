"use strict";
/**
 * API Hooks工具
 * 用于在页面中统一管理API请求状态
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRequests = exports.useApiRequest = exports.executeRequest = exports.requestFailure = exports.requestSuccess = exports.requestStart = exports.createRequestState = void 0;
/**
 * 创建一个请求状态对象
 * @returns 初始请求状态
 */
function createRequestState(initialData = null) {
    return {
        data: initialData,
        loading: false,
        success: false,
        error: '',
        lastLoaded: 0
    };
}
exports.createRequestState = createRequestState;
/**
 * 请求开始
 * @param state 当前状态
 * @returns 新状态
 */
function requestStart(state) {
    return {
        ...state,
        loading: true,
        error: ''
    };
}
exports.requestStart = requestStart;
/**
 * 请求成功
 * @param state 当前状态
 * @param data 响应数据
 * @returns 新状态
 */
function requestSuccess(state, data) {
    return {
        ...state,
        data,
        loading: false,
        success: true,
        error: '',
        lastLoaded: Date.now()
    };
}
exports.requestSuccess = requestSuccess;
/**
 * 请求失败
 * @param state 当前状态
 * @param error 错误信息
 * @returns 新状态
 */
function requestFailure(state, error) {
    return {
        ...state,
        loading: false,
        success: false,
        error
    };
}
exports.requestFailure = requestFailure;
/**
 * 执行API请求并管理状态
 * @param state 当前状态
 * @param apiCall API请求函数
 * @param setStateFn 设置状态函数
 * @param defaultData 默认数据（可选）
 */
async function executeRequest(state, apiCall, setStateFn, defaultData, cacheKey, cacheDuration = 3600000 // 默认缓存1小时
) {
    // 如果已经在加载中，则不重复请求
    if (state.loading) {
        return;
    }
    // 设置加载状态
    setStateFn(requestStart(state));
    // 检查是否有有效缓存
    let cachedData = null;
    let cacheIsValid = false;
    if (cacheKey) {
        try {
            const cachedItem = wx.getStorageSync(cacheKey);
            if (cachedItem) {
                const { data, timestamp } = cachedItem;
                const now = Date.now();
                // 如果缓存未过期，使用缓存数据
                if (timestamp && now - timestamp < cacheDuration) {
                    cachedData = data;
                    cacheIsValid = true;
                }
            }
        }
        catch (error) {
            console.error('读取缓存失败:', error);
        }
    }
    // 如果有有效缓存，先使用缓存数据
    if (cacheIsValid && cachedData) {
        setStateFn(requestSuccess(state, cachedData));
    }
    try {
        // 执行API请求
        const data = await apiCall();
        // 设置成功状态
        setStateFn(requestSuccess(state, data));
        // 如果提供了缓存键，保存到缓存
        if (cacheKey) {
            try {
                wx.setStorageSync(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                console.error('保存缓存失败:', error);
            }
        }
    }
    catch (error) {
        console.error('API请求失败:', error);
        // 设置错误状态
        const errorMessage = error instanceof Error ? error.message : '请求失败';
        setStateFn(requestFailure(state, errorMessage));
        // 如果提供了默认数据，则使用默认数据
        if (defaultData !== undefined) {
            setStateFn({
                ...state,
                data: defaultData,
                loading: false,
                success: false,
                error: errorMessage
            });
        }
    }
}
exports.executeRequest = executeRequest;
/**
 * API请求状态Hook
 * 用于统一管理API请求的加载状态、错误状态和数据
 */
/**
 * 使用API请求Hook
 * @param apiCall API调用函数
 * @param options 选项
 * @returns 请求状态对象
 */
function useApiRequest(apiCall, options = {}) {
    // 生成状态键
    const loadingKey = options.loadingKey || 'loading';
    const errorKey = options.errorKey || 'error';
    const dataKey = options.dataKey || 'data';
    // 请求状态对象
    const state = {
        loading: true,
        error: '',
        data: options.fallbackData
    };
    // 设置初始状态
    const initialState = {};
    initialState[loadingKey] = true;
    initialState[errorKey] = '';
    if (options.fallbackData !== undefined) {
        initialState[dataKey] = options.fallbackData;
    }
    // 执行请求
    const execute = (page) => {
        // 设置加载状态
        page.setData({
            [loadingKey]: true,
            [errorKey]: ''
        });
        // 执行API调用
        apiCall()
            .then(data => {
            // 处理成功响应
            const updateData = {
                [loadingKey]: false
            };
            updateData[dataKey] = data;
            page.setData(updateData);
            // 调用成功回调
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        })
            .catch(error => {
            console.error('API请求失败:', error);
            // 处理错误响应
            const errorMessage = error.message || '请求失败';
            const updateData = {
                [loadingKey]: false,
                [errorKey]: errorMessage
            };
            // 如果有fallback数据，在错误时使用
            if (options.fallbackData !== undefined) {
                updateData[dataKey] = options.fallbackData;
            }
            page.setData(updateData);
            // 调用错误回调
            if (options.onError) {
                options.onError(error);
            }
        });
    };
    return {
        state,
        initialState,
        execute
    };
}
exports.useApiRequest = useApiRequest;
/**
 * 创建一组API请求状态
 * @param requests 多个API请求
 * @returns 请求状态对象
 */
function createApiRequests(requests) {
    const initialState = {
        loading: {},
        error: {},
        data: {}
    };
    const executeAll = (page) => {
        // 重置状态
        const loadingState = {};
        const errorState = {};
        // 设置所有请求的加载状态
        Object.keys(requests).forEach(key => {
            loadingState[key] = true;
            errorState[key] = '';
        });
        page.setData({
            loading: loadingState,
            error: errorState
        });
        // 执行所有请求
        Object.entries(requests).forEach(([key, request]) => {
            request.apiCall()
                .then(data => {
                // 更新数据和加载状态
                page.setData({
                    [`data.${key}`]: data,
                    [`loading.${key}`]: false
                });
                // 调用成功回调
                if (request.options?.onSuccess) {
                    request.options.onSuccess(data);
                }
            })
                .catch(error => {
                console.error(`API请求失败 [${key}]:`, error);
                // 更新错误状态
                const errorMessage = error.message || '请求失败';
                const updateData = {
                    [`loading.${key}`]: false,
                    [`error.${key}`]: errorMessage
                };
                // 如果有fallback数据，在错误时使用
                if (request.options?.fallbackData !== undefined) {
                    updateData[`data.${key}`] = request.options.fallbackData;
                }
                page.setData(updateData);
                // 调用错误回调
                if (request.options?.onError) {
                    request.options.onError(error);
                }
            });
        });
    };
    return {
        initialState,
        executeAll
    };
}
exports.createApiRequests = createApiRequests;
