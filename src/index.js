"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessages = void 0;
var firebase_admin_1 = require("firebase-admin");
var firebase_functions_1 = require("firebase-functions");
var fs_1 = require("fs");
var node_fetch_1 = require("node-fetch");
var openai_1 = require("openai");
var path_1 = require("path");
var url_1 = require("url");
var serviceAccountJson = await Promise.resolve().then(function () { return require("./serviceAccount.json"); });
var serviceAccount = serviceAccountJson.default;
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
var db = firebase_admin_1.default.firestore();
var openai = new openai_1.default({
    apiKey: firebase_functions_1.default.config().openai.key,
});
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var filePath = path_1.default.join(__dirname, "../src/context.txt");
var context = fs_1.default.readFileSync(filePath, "utf8");
exports.processMessages = firebase_functions_1.default.pubsub
    .schedule("every 5 minutes")
    .onRun(function () { return __awaiter(void 0, void 0, void 0, function () {
    var oneDayAgo, messagesRef, messages, conversations, _loop_1, _i, _a, _b, convoId, senders;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                oneDayAgo = new Date(Date.now() - 86400000).toISOString();
                console.log("Checking messages since:", oneDayAgo);
                messagesRef = db.collection("messages").where("timestamp", ">=", oneDayAgo);
                return [4 /*yield*/, messagesRef.get()];
            case 1:
                messages = _c.sent();
                if (messages.empty) {
                    console.log("No new messages");
                    return [2 /*return*/, null];
                }
                console.log("Processing ".concat(messages.size, " messages..."));
                conversations = {};
                messages.forEach(function (doc) {
                    var msg = doc.data();
                    if (msg.sender.id === "u1") {
                        return;
                    }
                    var convoKey = msg.conversationId;
                    var senderKey = msg.sender.id;
                    if (!conversations[convoKey]) {
                        conversations[convoKey] = {};
                    }
                    if (!conversations[convoKey][senderKey]) {
                        conversations[convoKey][senderKey] = [];
                    }
                    conversations[convoKey][senderKey].push({ content: msg.content, timestamp: msg.timestamp });
                });
                _loop_1 = function (convoId, senders) {
                    var convoRef, convoDoc, convoData, lastResponseTimestamp, _d, _e, _f, senderId, texts, messages_1, filteredMessages, fullMessage, response, sendMessageResponse, _g, _h, _j, error_1;
                    return __generator(this, function (_k) {
                        switch (_k.label) {
                            case 0:
                                convoRef = db.collection("conversations").doc(convoId);
                                return [4 /*yield*/, convoRef.get()];
                            case 1:
                                convoDoc = _k.sent();
                                if (!convoDoc.exists || !convoDoc.data()) {
                                    console.log("No conversation found for ID: ".concat(convoId));
                                    return [2 /*return*/, "continue"];
                                }
                                convoData = convoDoc.data();
                                lastResponseTimestamp = convoData.lastResponseTimeByUser["u1"];
                                _d = 0, _e = Object.entries(senders);
                                _k.label = 2;
                            case 2:
                                if (!(_d < _e.length)) return [3 /*break*/, 11];
                                _f = _e[_d], senderId = _f[0], texts = _f[1];
                                messages_1 = texts.map(function (_a) {
                                    var content = _a.content, timestamp = _a.timestamp;
                                    return ({ content: content, timestamp: timestamp });
                                });
                                filteredMessages = messages_1.filter(function (msg) { return new Date(msg.timestamp) > new Date(lastResponseTimestamp); });
                                if (filteredMessages.length === 0) {
                                    return [3 /*break*/, 10];
                                }
                                fullMessage = filteredMessages.map(function (msg) { return msg.text; }).join(" ");
                                return [4 /*yield*/, openai.chat.completions.create({
                                        model: "gpt-4-turbo",
                                        messages: [
                                            {
                                                role: "system",
                                                content: "".concat(context),
                                            },
                                            {
                                                role: "user",
                                                content: "".concat(fullMessage),
                                            },
                                        ],
                                        max_tokens: 150,
                                        temperature: 1,
                                        top_p: 1,
                                        presence_penalty: 0,
                                        frequency_penalty: 0,
                                        n: 1,
                                        stream: false,
                                    })];
                            case 3:
                                response = _k.sent();
                                _k.label = 4;
                            case 4:
                                _k.trys.push([4, 9, , 10]);
                                return [4 /*yield*/, (0, node_fetch_1.default)("https://little-help.vercel.app/api/send-message", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            senderId: "u1",
                                            receiverId: senderId,
                                            content: response.choices[0].message.content,
                                        }),
                                    })];
                            case 5:
                                sendMessageResponse = _k.sent();
                                if (!sendMessageResponse.ok) return [3 /*break*/, 6];
                                console.log("Message sent successfully:", response.choices[0].message.content);
                                return [3 /*break*/, 8];
                            case 6:
                                _h = (_g = console).error;
                                _j = ["Failed to send message:"];
                                return [4 /*yield*/, sendMessageResponse.text()];
                            case 7:
                                _h.apply(_g, _j.concat([_k.sent()]));
                                _k.label = 8;
                            case 8: return [3 /*break*/, 10];
                            case 9:
                                error_1 = _k.sent();
                                console.error("Error sending message:", error_1);
                                return [3 /*break*/, 10];
                            case 10:
                                _d++;
                                return [3 /*break*/, 2];
                            case 11: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, _a = Object.entries(conversations);
                _c.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                _b = _a[_i], convoId = _b[0], senders = _b[1];
                return [5 /*yield**/, _loop_1(convoId, senders)];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, null];
        }
    });
}); });
