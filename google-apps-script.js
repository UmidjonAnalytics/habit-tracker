/**
 * =========================================================================
 * HABIT TRACKER - GOOGLE APPS SCRIPT BACKEND (AUTO-SETUP)
 * =========================================================================
 * Ushbu skript mustaqil ishlaydi: agar jadval mavjud bo'lmasa,
 * o'zi Google Drive'da yangi "Mening Odatlarim" jadvalini ochadi!
 */

var HABITS_SHEET_NAME = "Habits";
var LOGS_SHEET_NAME = "Logs";

/**
 * Jadvalni olish yoki avtomatik yangi yaratish
 */
function getSpreadsheet() {
  // 1. Agar jadval ichida (container-bound) ishlayotgan bo'lsa:
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  // 2. Agar alohida skript bo'lsa, xotiradan qidirish:
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty("SHEET_ID");
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {}
  }

  // 3. Yangi jadval ochish va ID sini saqlash
  var newSheet = SpreadsheetApp.create("Mening Odatlarim (Habit Tracker)");
  props.setProperty("SHEET_ID", newSheet.getId());
  return newSheet;
}

/**
 * Dastlabki varaqlarni avtomatik yaratish va sarlavhalarni qo'yish
 */
function setupSheets() {
  var ss = getSpreadsheet();
  
  // 1. Habits jadvali
  var habitsSheet = ss.getSheetByName(HABITS_SHEET_NAME);
  if (!habitsSheet) {
    habitsSheet = ss.insertSheet(HABITS_SHEET_NAME);
    habitsSheet.appendRow(["ID", "Name", "Type", "Target", "Unit", "Icon", "Color", "Active", "CreatedAt"]);
    habitsSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e0e7ff");
    habitsSheet.setFrozenRows(1);
    
    // Boshlang'ich namunaviy odatlar
    habitsSheet.appendRow(["h_1", "Ertalabki badantarbiya", "boolean", 1, "marta", "🏃", "#10b981", true, new Date()]);
    habitsSheet.appendRow(["h_2", "Suv ichish", "number", 2.5, "litr", "💧", "#3b82f6", true, new Date()]);
    habitsSheet.appendRow(["h_3", "Kitob o'qish", "number", 20, "sahifa", "📚", "#8b5cf6", true, new Date()]);
    habitsSheet.appendRow(["h_4", "Dasturlash / O'rganish", "number", 45, "daqiqa", "💻", "#f59e0b", true, new Date()]);
    habitsSheet.appendRow(["h_5", "Kechki sayr & Uyqu rejimi", "boolean", 1, "marta", "🌙", "#ec4899", true, new Date()]);
  }
  
  // 2. Logs jadvali
  var logsSheet = ss.getSheetByName(LOGS_SHEET_NAME);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(LOGS_SHEET_NAME);
    logsSheet.appendRow(["Date", "HabitID", "HabitName", "Value", "Target", "Status", "Timestamp"]);
    logsSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dcfce7");
    logsSheet.setFrozenRows(1);
  }

  // Standart Sheet1 bo'sh qolgan bo'lsa uni olib tashlash (optional)
  var sheet1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Лист1");
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) {}
  }
}

/**
 * GET so'rovlarni qabul qilish
 */
function doGet(e) {
  try {
    setupSheets();
    var ss = getSpreadsheet();
    var habitsSheet = ss.getSheetByName(HABITS_SHEET_NAME);
    var logsSheet = ss.getSheetByName(LOGS_SHEET_NAME);
    
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get_all";
    
    if (action === "ping") {
      return responseJSON({ 
        status: "success", 
        message: "Google Sheets aloqasi muvaffaqiyatli!",
        sheetUrl: ss.getUrl()
      });
    }
    
    var habits = getHabitsData(habitsSheet);
    var logs = getLogsData(logsSheet);
    var stats = calculateStats(habits, logs);
    
    return responseJSON({
      status: "success",
      sheetUrl: ss.getUrl(),
      habits: habits,
      logs: logs,
      stats: stats,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

/**
 * POST so'rovlarni qabul qilish
 */
function doPost(e) {
  try {
    setupSheets();
    var ss = getSpreadsheet();
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("Bo'sh ma'lumot yuborildi");
    }
    
    var action = data.action;
    
    if (action === "log_habit") {
      var result = saveHabitLog(ss, data);
      return responseJSON({ status: "success", result: result });
    } else if (action === "add_habit") {
      var newHabit = addHabit(ss, data.habit);
      return responseJSON({ status: "success", habit: newHabit });
    } else if (action === "batch_sync") {
      if (Array.isArray(data.logs)) {
        data.logs.forEach(function(item) {
          saveHabitLog(ss, item);
        });
      }
      return responseJSON({ status: "success", syncedCount: (data.logs || []).length });
    }
    
    return responseJSON({ status: "error", message: "Noma'lum amal: " + action });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function getHabitsData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var habits = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[0] && row[7] !== false && row[7] !== "FALSE") {
      habits.push({
        id: String(row[0]),
        name: String(row[1]),
        type: String(row[2]),
        target: Number(row[3]) || 1,
        unit: String(row[4] || ""),
        icon: String(row[5] || "⭐"),
        color: String(row[6] || "#6366f1"),
        active: Boolean(row[7]),
        createdAt: row[8]
      });
    }
  }
  return habits;
}

function getLogsData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return {};
  
  var logsByDate = {};
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var rawDate = row[0];
    if (!rawDate) continue;
    
    var dateStr = formatDateKey(rawDate);
    var habitId = String(row[1]);
    var val = Number(row[3]);
    var target = Number(row[4]) || 1;
    var status = String(row[5] || "completed");
    
    if (!logsByDate[dateStr]) {
      logsByDate[dateStr] = {};
    }
    
    logsByDate[dateStr][habitId] = {
      value: val,
      target: target,
      status: status,
      timestamp: row[6]
    };
  }
  return logsByDate;
}

function saveHabitLog(ss, data) {
  var logsSheet = ss.getSheetByName(LOGS_SHEET_NAME);
  var dateStr = data.date;
  var habitId = String(data.habitId);
  var value = Number(data.value);
  var habitName = data.habitName || "";
  var target = Number(data.target) || 1;
  
  var status = "pending";
  if (value >= target) {
    status = "completed";
  } else if (value > 0) {
    status = "partial";
  } else {
    status = "skipped";
  }
  
  var rows = logsSheet.getDataRange().getValues();
  var foundRowIndex = -1;
  
  for (var i = 1; i < rows.length; i++) {
    var rDate = formatDateKey(rows[i][0]);
    var rHabitId = String(rows[i][1]);
    if (rDate === dateStr && rHabitId === habitId) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  var now = new Date();
  if (foundRowIndex > 0) {
    logsSheet.getRange(foundRowIndex, 4).setValue(value);
    logsSheet.getRange(foundRowIndex, 5).setValue(target);
    logsSheet.getRange(foundRowIndex, 6).setValue(status);
    logsSheet.getRange(foundRowIndex, 7).setValue(now);
  } else {
    logsSheet.appendRow([dateStr, habitId, habitName, value, target, status, now]);
  }
  
  return { date: dateStr, habitId: habitId, value: value, status: status };
}

function addHabit(ss, habit) {
  var sheet = ss.getSheetByName(HABITS_SHEET_NAME);
  var id = "h_" + Utilities.getUuid().substring(0, 8);
  var name = habit.name;
  var type = habit.type || "boolean";
  var target = Number(habit.target) || 1;
  var unit = habit.unit || (type === "boolean" ? "marta" : "");
  var icon = habit.icon || "⭐";
  var color = habit.color || "#6366f1";
  var active = true;
  var createdAt = new Date();
  
  sheet.appendRow([id, name, type, target, unit, icon, color, active, createdAt]);
  
  return {
    id: id,
    name: name,
    type: type,
    target: target,
    unit: unit,
    icon: icon,
    color: color,
    active: active
  };
}

function calculateStats(habits, logsByDate) {
  var streaks = {};
  var totalDays = Object.keys(logsByDate).length;
  var todayStr = formatDateKey(new Date());
  
  habits.forEach(function(h) {
    var currentStreak = 0;
    var completedCount = 0;
    
    var todayLog = logsByDate[todayStr] && logsByDate[todayStr][h.id];
    var isTodayDone = todayLog && todayLog.status === "completed";
    
    if (isTodayDone) {
      currentStreak++;
    }
    
    var tempDate = new Date();
    tempDate.setDate(tempDate.getDate() - 1);
    
    for (var d = 0; d < 60; d++) {
      var dKey = formatDateKey(tempDate);
      var log = logsByDate[dKey] && logsByDate[dKey][h.id];
      if (log && log.status === "completed") {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    Object.keys(logsByDate).forEach(function(k) {
      var l = logsByDate[k][h.id];
      if (l && l.status === "completed") {
        completedCount++;
      }
    });
    
    streaks[h.id] = {
      currentStreak: currentStreak,
      completedDays: completedCount,
      completionRate: totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0
    };
  });
  
  return {
    streaks: streaks,
    totalLoggedDays: totalDays
  };
}

function formatDateKey(d) {
  if (typeof d === "string" && d.length === 10 && d.indexOf("-") === 4) {
    return d;
  }
  var dateObj = (d instanceof Date) ? d : new Date(d);
  var year = dateObj.getFullYear();
  var month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
  var day = ("0" + dateObj.getDate()).slice(-2);
  return year + "-" + month + "-" + day;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
