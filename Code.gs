function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Set CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  
  const callback = e.parameter.callback;
  if (!callback) {
    return output.setContent('console.error("No callback provided")');
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : null;
    
    if (!data) {
      return output.setContent(callback + '(' + JSON.stringify({
        success: false,
        error: 'No data provided'
      }) + ');');
    }

    if (data.action === 'setBroadcast') {
      const systemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SYSTEM');
      if (!systemSheet) {
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'SYSTEM sheet not found'
        }) + ');');
      }

      try {
        // Update broadcast message and URL in first row
        systemSheet.getRange('A1').setValue(data.message || '');
        systemSheet.getRange('B1').setValue(data.redirectUrl || '');
        
        return output.setContent(callback + '(' + JSON.stringify({
          success: true
        }) + ');');
      } catch (err) {
        console.error('Broadcast error:', err);
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Failed to update broadcast'
        }) + ');');
      }
    }

    if (data.action === 'makeTransaction') {
      const fromUserId = data.fromUserId;
      const toUserId = data.toUserId;
      const amount = parseInt(data.amount);
      
      // Find rows for both users
      const values = sheet.getDataRange().getValues();
      let fromRow = -1;
      let toRow = -1;
      
      for (let i = 1; i < values.length; i++) {
        const currentId = values[i][0].toString();
        if (currentId === toUserId) toRow = i + 1;
        if (fromUserId !== 'SYSTEM' && currentId === fromUserId) fromRow = i + 1;
      }
      
      if (toRow === -1) {
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Recipient not found'
        }) + ');');
      }

      // Check if either user is banned (except SYSTEM)
      if (fromUserId !== 'SYSTEM') {
        const fromBanState = sheet.getRange(fromRow, 3).getValue();
        if (fromBanState === 'TRUE') {
          return output.setContent(callback + '(' + JSON.stringify({
            success: false,
            error: 'Sender is banned'
          }) + ');');
        }
      }

      const toBanState = sheet.getRange(toRow, 3).getValue();
      if (toBanState === 'TRUE') {
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Recipient is banned'
        }) + ');');
      }

      // Get current balances
      const toBalance = parseInt(sheet.getRange(toRow, 2).getValue()) || 0;
      
      if (fromUserId !== 'SYSTEM') {
        const fromBalance = parseInt(sheet.getRange(fromRow, 2).getValue()) || 0;
        if (fromBalance < amount) {
          return output.setContent(callback + '(' + JSON.stringify({
            success: false,
            error: 'Insufficient balance'
          }) + ');');
        }
        // Update sender's balance
        sheet.getRange(fromRow, 2).setValue(fromBalance - amount);
      }
      
      // Update recipient's balance
      sheet.getRange(toRow, 2).setValue(toBalance + amount);
      
      // Log the transaction
      const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
      if (logSheet) {
        logSheet.appendRow([
          new Date(),
          fromUserId,
          toUserId,
          amount,
          ''  // Empty reason for regular transactions
        ]);
      }
      
      return output.setContent(callback + '(' + JSON.stringify({
        success: true
      }) + ');');
    }

    if (data.action === 'setBanState') {
      const userId = data.userId;
      const isBanned = data.isBanned;
      const banReason = data.banReason || '';
      
      // Find user's row
      const values = sheet.getDataRange().getValues();
      let userRow = -1;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0].toString() === userId) {
          userRow = i + 1;
          break;
        }
      }
      
      if (userRow === -1) {
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'User not found'
        }) + ');');
      }
      
      try {
        // Update ban state in column C and reason in column D
        sheet.getRange(userRow, 3).setValue(isBanned ? 'TRUE' : 'FALSE');
        sheet.getRange(userRow, 4).setValue(isBanned ? banReason : '');
        
        // Log the ban action
        const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
        if (logSheet) {
          logSheet.appendRow([
            new Date(),
            'SYSTEM',
            userId,
            isBanned ? 'BANNED' : 'UNBANNED',
            banReason
          ]);
        }
        
        return output.setContent(callback + '(' + JSON.stringify({
          success: true
        }) + ');');
      } catch (err) {
        console.error('Ban state error:', err);
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Failed to update ban state'
        }) + ');');
      }
    }

    // Handle chat messages
    if (data.action === 'sendMessage') {
      const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
      if (!chatSheet) {
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Chat sheet not found'
        }) + ');');
      }
      
      try {
        chatSheet.appendRow([
          data.timestamp,
          data.username,
          data.message || '',
          data.image ? data.image.replace(/"/g, '""') : '',
          '{}',  // reactions
          data.replyTo || ''  // reply data
        ]);
        
        return output.setContent(callback + '(' + JSON.stringify({
          success: true
        }) + ');');
      } catch (err) {
        console.error('Chat error:', err);
        return output.setContent(callback + '(' + JSON.stringify({
          success: false,
          error: 'Failed to save message'
        }) + ');');
      }
    }

    // Handle reactions
    if (data.action === 'toggleReaction') {
      const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
      if (!chatSheet) return output.setContent(callback + '(' + JSON.stringify({ success: false }));
      
      const values = chatSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.messageTimestamp) {
          const reactions = JSON.parse(values[i][4] || '{}');
          if (!reactions[data.emoji]) reactions[data.emoji] = [];
          
          const userIndex = reactions[data.emoji].indexOf(data.username);
          if (userIndex === -1) {
            reactions[data.emoji].push(data.username);
          } else {
            reactions[data.emoji].splice(userIndex, 1);
            if (reactions[data.emoji].length === 0) delete reactions[data.emoji];
          }
          
          chatSheet.getRange(i + 1, 5).setValue(JSON.stringify(reactions));
          return output.setContent(callback + '(' + JSON.stringify({ success: true }) + ');');
        }
      }
      return output.setContent(callback + '(' + JSON.stringify({ success: false }) + ');');
    }

    // Handle typing indicators
    if (data.action === 'updateTyping') {
      const typingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('typing');
      if (!typingSheet) return output.setContent(callback + '(' + JSON.stringify({ success: false }));
      
      const values = typingSheet.getDataRange().getValues();
      let found = false;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.username) {
          typingSheet.getRange(i + 1, 2).setValue(data.isTyping);
          found = true;
          break;
        }
      }
      
      if (!found && data.isTyping) {
        typingSheet.appendRow([data.username, true]);
      }
      
      return output.setContent(callback + '(' + JSON.stringify({ success: true }) + ');');
    }

    // Handle online status updates
    if (data.action === 'updateOnlineStatus') {
      const onlineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('onlineUsers');
      if (!onlineSheet) {
        onlineSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('onlineUsers');
        onlineSheet.appendRow(['username', 'lastActive']);
      }
      
      const values = onlineSheet.getDataRange().getValues();
      let found = false;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.username) {
          if (data.isOnline) {
            onlineSheet.getRange(i + 1, 2).setValue(data.timestamp);
          } else {
            onlineSheet.deleteRow(i + 1);
          }
          found = true;
          break;
        }
      }
      
      if (!found && data.isOnline) {
        onlineSheet.appendRow([data.username, data.timestamp]);
      }
      
      return output.setContent(callback + '(' + JSON.stringify({ success: true }) + ');');
    }
    
    return output.setContent(callback + '(' + JSON.stringify({
      success: false,
      error: 'Invalid action'
    }) + ');');
    
  } catch (error) {
    console.error('Main error:', error);
    return output.setContent(callback + '(' + JSON.stringify({
      success: false,
      error: error.toString()
    }) + ');');
  }
} '