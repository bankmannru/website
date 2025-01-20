function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  
  const callback = e.parameter.callback;
  if (!callback) {
    return output.setContent('console.error("No callback provided");');
  }

  try {
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : null;
    if (!data) {
      return output.setContent(callback + '(' + JSON.stringify({
        success: false,
        error: 'No data provided'
      }) + ');');
    }

    let result = null;
    
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
        
        result = { success: true };
      } catch (err) {
        console.error('Broadcast error:', err);
        result = {
          success: false,
          error: 'Failed to update broadcast'
        };
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
      
      result = { success: true };
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
        
        result = { success: true };
      } catch (err) {
        console.error('Ban state error:', err);
        result = {
          success: false,
          error: 'Failed to update ban state'
        };
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
        
        result = { success: true };
      } catch (err) {
        console.error('Chat error:', err);
        result = {
          success: false,
          error: 'Failed to save message'
        };
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
          result = { success: true };
          return output.setContent(callback + '(' + JSON.stringify(result) + ');');
        }
      }
      result = { success: false };
      return output.setContent(callback + '(' + JSON.stringify(result) + ');');
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
      
      result = { success: true };
      return output.setContent(callback + '(' + JSON.stringify(result) + ');');
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
      
      result = { success: true };
      return output.setContent(callback + '(' + JSON.stringify(result) + ');');
    }

    // Handle shell commands
    if (data.action === 'executeShell') {
      try {
        const command = data.command;
        const args = command.split(' ');
        const cmd = args[0];
        
        let output = '';
        
        switch(cmd) {
          case 'help':
            output = `Available commands:
              Chat Management:
              /clear - Clear chat history
              /ban <username> [reason] - Ban a user
              /unban <username> - Unban a user
              /mute <username> <minutes> - Mute user temporarily
              /broadcast <message> - Send system broadcast
              /users - List all online users
              /history <username> - Show user's message history
              
              System Commands:
              /ls [path] - List files and directories
              /cat <file> - Show file contents
              /stats - Show chat statistics
              /ping - Check system status
              /uptime - Show server uptime
              /search <query> - Search messages
              /export - Export chat logs
              
              Type /help <command> for detailed usage`;
            break;
            
          case 'clear':
            const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
            chatSheet.clear();
            chatSheet.appendRow(['timestamp', 'username', 'message', 'image', 'reactions', 'replyTo']);
            output = 'Chat history cleared';
            break;
            
          case 'ban':
            if (args.length < 2) {
              output = 'Usage: /ban <username> [reason]';
              break;
            }
            const banReason = args.slice(2).join(' ') || 'No reason provided';
            const banResult = setBanState(args[1], true, banReason);
            output = banResult ? `Banned ${args[1]}: ${banReason}` : 'Failed to ban user';
            break;
            
          case 'unban':
            if (args.length < 2) {
              output = 'Usage: /unban <username>';
              break;
            }
            const unbanResult = setBanState(args[1], false);
            output = unbanResult ? `Unbanned ${args[1]}` : 'Failed to unban user';
            break;
            
          case 'users':
            const onlineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('onlineUsers');
            const users = onlineSheet.getDataRange().getValues();
            output = 'Online users:\n' + users.slice(1).map(row => 
              `${row[0]} (last active: ${new Date(row[1]).toLocaleString()})`
            ).join('\n');
            break;
            
          case 'stats':
            const stats = {
              messages: chatSheet.getLastRow() - 1,
              users: new Set(chatSheet.getRange('B2:B').getValues().flat()).size,
              images: chatSheet.getRange('D2:D').getValues().filter(([v]) => v).length
            };
            output = `Chat Statistics:
              Total Messages: ${stats.messages}
              Unique Users: ${stats.users}
              Images Shared: ${stats.images}`;
            break;
            
          case 'search':
            if (args.length < 2) {
              output = 'Usage: /search <query>';
              break;
            }
            const query = args.slice(1).join(' ').toLowerCase();
            const messages = chatSheet.getDataRange().getValues();
            const results = messages.slice(1).filter(row => 
              row[2].toLowerCase().includes(query)
            ).map(row => 
              `[${new Date(row[0]).toLocaleString()}] ${row[1]}: ${row[2]}`
            );
            output = results.length ? results.join('\n') : 'No messages found';
            break;
            
          case 'ls':
            const path = args[1] || '.';
            const folder = DriveApp.getFolderById(path === '.' ? 
              DriveApp.getRootFolder().getId() : path);
            const files = folder.getFiles();
            const folders = folder.getFolders();
            output = 'Directories:\n';
            while (folders.hasNext()) {
              const f = folders.next();
              output += `📁 ${f.getName()} (${f.getId()})\n`;
            }
            output += '\nFiles:\n';
            while (files.hasNext()) {
              const f = files.next();
              output += `📄 ${f.getName()} (${f.getId()})\n`;
            }
            break;
            
          case 'cat':
            if (args.length < 2) {
              output = 'Usage: /cat <fileId>';
              break;
            }
            try {
              const file = DriveApp.getFileById(args[1]);
              output = file.getBlob().getDataAsString();
            } catch (e) {
              output = 'Error: File not found or cannot be read';
            }
            break;
            
          case 'export':
            const csvContent = chatSheet.getDataRange().getValues()
              .map(row => row.join(','))
              .join('\n');
            const exportFile = DriveApp.createFile('chat_export.csv', csvContent, 'text/csv');
            output = `Chat logs exported: ${exportFile.getUrl()}`;
            break;
            
          default:
            output = 'Unknown command. Type /help for available commands.';
        }
        
        result = {
          success: true,
          output
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to execute command'
        };
      }
    }

    // Handle translation requests
    if (data.action === 'translateText') {
      try {
        const text = data.text;
        const targetLang = data.targetLang;
        
        // Use Google Translate API
        const translatedText = LanguageApp.translate(text, 'auto', targetLang);
        
        result = {
          success: true,
          translatedText
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Translation failed'
        };
      }
    }

    // Handle message pinning
    if (data.action === 'pinMessage') {
      const pinnedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pinnedMessages');
      if (!pinnedSheet) {
        SpreadsheetApp.getActiveSpreadsheet().insertSheet('pinnedMessages');
        pinnedSheet.appendRow(['messageId', 'pinnedBy', 'timestamp']);
      }
      
      try {
        pinnedSheet.appendRow([data.messageId, data.username, new Date().toISOString()]);
        result = { success: true };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to pin message'
        };
      }
    }

    // Handle dashboard stats request
    if (data.action === 'getDashboardStats') {
      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet();
        const usersSheet = sheet.getSheetByName('Sheet1');
        const chatSheet = sheet.getSheetByName('chatLogs');
        const onlineSheet = sheet.getSheetByName('onlineUsers');
        
        // Get all users
        const totalUsers = usersSheet ? Math.max(0, usersSheet.getLastRow() - 1) : 0;
        
        // Get banned users
        const bannedUsers = usersSheet ? 
          usersSheet.getRange('C2:C' + usersSheet.getLastRow())
            .getValues()
            .filter(([v]) => v === true || v === 'TRUE')
            .length : 0;
        
        // Get total messages
        const messagesTotal = chatSheet ? Math.max(0, chatSheet.getLastRow() - 1) : 0;
        
        // Get online users
        const onlineUsers = onlineSheet ? Math.max(0, onlineSheet.getLastRow() - 1) : 0;
        
        result = {
          success: true,
          stats: {
            totalUsers,
            bannedUsers,
            messagesTotal,
            onlineUsers
          }
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to get stats: ' + err.toString()
        };
      }
    }

    // Handle user list request
    if (data.action === 'getUsers') {
      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
        if (!sheet) {
          return output.setContent(callback + '(' + JSON.stringify({
            success: false,
            error: 'Users sheet not found'
          }) + ');');
        }
        
        const lastRow = sheet.getLastRow();
        if (lastRow <= 1) {
          return output.setContent(callback + '(' + JSON.stringify({
            success: true,
            users: []
          }) + ');');
        }
        
        const values = sheet.getRange('A2:D' + lastRow).getValues();
        const users = values.map(row => ({
          username: row[0],
          balance: row[1],
          isBanned: row[2] === true || row[2] === 'TRUE',
          banReason: row[3] || ''
        }));
        
        result = {
          success: true,
          users
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to get users: ' + err.toString()
        };
      }
    }

    // Handle card generation
    if (data.action === 'generateCards') {
      try {
        const cardsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cards');
        if (!cardsSheet) {
          SpreadsheetApp.getActiveSpreadsheet().insertSheet('Cards');
          cardsSheet.appendRow(['number', 'value', 'used', 'usedBy', 'usedAt']);
        }
        
        const cards = [];
        for (let i = 0; i < data.count; i++) {
          const cardNumber = generateUniqueCardNumber();
          cardsSheet.appendRow([cardNumber, data.amount, false, '', '']);
          cards.push(cardNumber);
        }
        
        result = {
          success: true,
          cards
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to generate cards'
        };
      }
    }

    // Handle user history request
    if (data.action === 'getUserHistory') {
      try {
        const username = data.username;
        const transactionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
        const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
        
        const history = [];
        
        // Get transactions
        if (transactionSheet) {
          const transactions = transactionSheet.getDataRange().getValues();
          transactions.slice(1).forEach(row => {
            if (row[1] === username || row[2] === username) {
              history.push({
                timestamp: row[0],
                type: 'Transaction',
                amount: row[1] === username ? -row[3] : row[3],
                details: row[4] || `${row[1]} → ${row[2]}`
              });
            }
          });
        }
        
        // Get chat activity
        if (chatSheet) {
          const messages = chatSheet.getDataRange().getValues();
          messages.slice(1).forEach(row => {
            if (row[1] === username) {
              history.push({
                timestamp: row[0],
                type: 'Message',
                amount: '-',
                details: row[2] || 'Image shared'
              });
            }
          });
        }
        
        // Sort by timestamp
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        result = {
          success: true,
          history
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to get user history'
        };
      }
    }

    // Handle chat clear request
    if (data.action === 'clearChats') {
      try {
        const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
        if (chatSheet) {
          chatSheet.clear();
          chatSheet.appendRow(['timestamp', 'username', 'message', 'image', 'reactions', 'replyTo']);
        }
        result = { success: true };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to clear chats'
        };
      }
    }

    // Handle search messages
    if (data.action === 'searchMessages') {
      try {
        const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('chatLogs');
        if (!chatSheet) {
          return output.setContent(callback + '(' + JSON.stringify({
            success: true,
            messages: []
          }) + ');');
        }
        
        const values = chatSheet.getDataRange().getValues();
        const query = (data.query || '').toLowerCase();
        
        const messages = values.slice(1) // Skip header row
          .filter(row => {
            const message = (row[2] || '').toLowerCase();
            const user = (row[1] || '').toLowerCase();
            return message.includes(query) || user.includes(query);
          })
          .map(row => ({
            timestamp: row[0],
            user: row[1],
            message: row[2],
            image: row[3]
          }))
          .reverse() // Show newest first
          .slice(0, 100); // Limit to 100 messages
        
        result = {
          success: true,
          messages
        };
      } catch (err) {
        result = {
          success: false,
          error: 'Failed to search messages: ' + err.toString()
        };
      }
    }

    // Handle executeCommand
    if (data.action === 'executeCommand') {
      try {
        const command = data.command.toLowerCase().trim();
        let output = '';

        if (command === 'help') {
          output = `Available commands:
- help: Show this help message
- users: List all users
- ban <username> [reason]: Ban a user
- unban <username>: Unban a user
- give <username> <amount>: Give coins to user
- take <username> <amount>: Take coins from user
- stats: Show system statistics
- clear: Clear terminal output`;
        } 
        else if (command === 'users') {
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
          const users = sheet.getRange('A2:D' + sheet.getLastRow()).getValues();
          output = users.map(row => 
            `${row[0]} | Balance: ${row[1]} | ${row[2] === 'TRUE' ? '🚫 BANNED' : '✅ Active'}`
          ).join('\n');
        }
        else if (command === 'stats') {
          const sheet = SpreadsheetApp.getActiveSpreadsheet();
          const usersSheet = sheet.getSheetByName('Sheet1');
          const chatSheet = sheet.getSheetByName('chatLogs');
          const onlineSheet = sheet.getSheetByName('onlineUsers');
          
          const totalUsers = usersSheet ? Math.max(0, usersSheet.getLastRow() - 1) : 0;
          const bannedUsers = usersSheet ? 
            usersSheet.getRange('C2:C' + usersSheet.getLastRow())
              .getValues()
              .filter(([v]) => v === true || v === 'TRUE')
              .length : 0;
          const totalMessages = chatSheet ? Math.max(0, chatSheet.getLastRow() - 1) : 0;
          const onlineUsers = onlineSheet ? Math.max(0, onlineSheet.getLastRow() - 1) : 0;
          
          output = `System Statistics:
Total Users: ${totalUsers}
Online Users: ${onlineUsers}
Banned Users: ${bannedUsers}
Total Messages: ${totalMessages}`;
        }
        else if (command === 'clear') {
          output = 'Terminal cleared';
        }
        else if (command.startsWith('ban ')) {
          const parts = command.split(' ');
          const username = parts[1];
          const reason = parts.slice(2).join(' ') || 'No reason provided';
          
          // Find user's row
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
          const values = sheet.getDataRange().getValues();
          let userRow = -1;
          
          for (let i = 1; i < values.length; i++) {
            if (values[i][0].toString() === username) {
              userRow = i + 1;
              break;
            }
          }
          
          if (userRow === -1) {
            output = `Failed to ban ${username}: User not found`;
          } else {
            try {
              // Update ban state in column C and reason in column D
              sheet.getRange(userRow, 3).setValue('TRUE');
              sheet.getRange(userRow, 4).setValue(reason);
              
              // Log the ban action
              const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
              if (logSheet) {
                logSheet.appendRow([new Date(), 'SYSTEM', username, 'BANNED', reason]);
              }
              
              output = `Successfully banned ${username} (Reason: ${reason})`;
            } catch (err) {
              output = `Failed to ban ${username}: ${err.toString()}`;
            }
          }
        }
        else if (command.startsWith('unban ')) {
          const username = command.split(' ')[1];
          // Find user's row
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
          const values = sheet.getDataRange().getValues();
          let userRow = -1;
          
          for (let i = 1; i < values.length; i++) {
            if (values[i][0].toString() === username) {
              userRow = i + 1;
              break;
            }
          }
          
          if (userRow === -1) {
            output = `Failed to unban ${username}: User not found`;
          } else {
            try {
              // Update ban state and clear reason
              sheet.getRange(userRow, 3).setValue('FALSE');
              sheet.getRange(userRow, 4).setValue('');
              
              // Log the unban action
              const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
              if (logSheet) {
                logSheet.appendRow([new Date(), 'SYSTEM', username, 'UNBANNED', '']);
              }
              
              output = `Successfully unbanned ${username}`;
            } catch (err) {
              output = `Failed to unban ${username}: ${err.toString()}`;
            }
          }
        }
        else if (command.startsWith('give ')) {
          const parts = command.split(' ');
          const username = parts[1];
          const amount = parseInt(parts[2]);
          
          if (isNaN(amount) || amount <= 0) {
            output = 'Invalid amount';
          } else {
            try {
              const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
              const values = sheet.getDataRange().getValues();
              let userRow = -1;
              
              for (let i = 1; i < values.length; i++) {
                if (values[i][0].toString() === username) {
                  userRow = i + 1;
                  break;
                }
              }
              
              if (userRow === -1) {
                output = `Failed to give coins: User ${username} not found`;
              } else {
                const currentBalance = parseInt(sheet.getRange(userRow, 2).getValue()) || 0;
                sheet.getRange(userRow, 2).setValue(currentBalance + amount);
                
                // Log transaction
                const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
                if (logSheet) {
                  logSheet.appendRow([new Date(), 'SYSTEM', username, amount, 'Admin give command']);
                }
                
                output = `Successfully gave ${amount} coins to ${username}`;
              }
            } catch (err) {
              output = `Failed to give coins: ${err.toString()}`;
            }
          }
        }
        else if (command.startsWith('login ')) {
          const password = command.split(' ')[1];
          if (password === 'admun') { // Make sure this matches your ADMIN_PASSWORD
            output = 'Successfully logged in as admin';
          } else {
            output = 'Invalid password';
          }
        }
        else {
          output = 'Unknown command. Type "help" for available commands.';
        }

        return ContentService.createTextOutput()
          .setMimeType(ContentService.MimeType.JAVASCRIPT)
          .setContent(callback + '(' + JSON.stringify({
            success: true,
            output: output
          }) + ');');
      } catch (err) {
        return ContentService.createTextOutput()
          .setMimeType(ContentService.MimeType.JAVASCRIPT)
          .setContent(callback + '(' + JSON.stringify({
            success: false,
            error: 'Failed to execute command: ' + err.toString()
          }) + ');');
      }
    }

    function generateUniqueCardNumber() {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    }

    return ContentService.createTextOutput()
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
      .setContent(callback + '(' + JSON.stringify(result) + ');');
  } catch (error) {
    return ContentService.createTextOutput()
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
      .setContent(callback + '(' + JSON.stringify({
        success: false,
        error: error.toString()
      }) + ');');
  }
}