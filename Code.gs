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
        systemSheet.getRange('A1').setValue(data.message);
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
} 