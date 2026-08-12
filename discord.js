const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// المعرفات والقنوات
const SUGGESTION_CHANNEL_ID = '1536412906516652052';
const BROADCAST_CHANNEL_ID = '1536820051238453249';
const REPORT_TRIGGER = 'REPORT_FETCH_SYS_998123_EVAL_X7';

// تخزين الاقتراحات وقفل عملية الإرسال الجماعي
const storedSuggestions = [];
let isBroadcasting = false;

client.on('ready', () => {
  console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // ⛔ إيقاف صارم للبوتات لمنع الـ Loop / Crash
  if (message.author.bot) return;

  // ---------------------------------------------------------
  // 1️⃣ نظام التقييمات والاقتراحات
  // ---------------------------------------------------------
  if (message.channel.id === SUGGESTION_CHANNEL_ID) {
    const content = message.content.trim();

    // 📋 نظام التقرير
    if (content === REPORT_TRIGGER) {
      await message.delete().catch(() => {});

      if (storedSuggestions.length === 0) {
        return message.author.send('❌ لا توجد اقتراحات مسجلة حالياً.').catch(() => {});
      }

      const reportText = storedSuggestions
        .map((item, index) => `**#${index + 1}** من <@${item.authorId}>:\n${item.text}`)
        .join('\n\n---\n\n');

      try {
        await message.author.send(`📊 **تقرير الاقتراحات المحفوظة (${storedSuggestions.length}):**\n\n${reportText}`);
      } catch (err) {
        console.error('تعذر إرسال الخاص للتقرير:', err);
      }
      return;
    }

    // 💡 التعامل مع الاقتراح الجديد
    const suggestionText = message.content;
    const authorName = message.author.tag;
    const authorIcon = message.author.displayAvatarURL({ dynamic: true });

    // حذف رسالة العضو الأصلية
    await message.delete().catch(() => {});

    // حفظ الاقتراح
    storedSuggestions.push({
      authorId: message.author.id,
      text: suggestionText,
      date: new Date()
    });

    // إنشاء الـ Embed
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setAuthor({ name: authorName, iconURL: authorIcon })
      .setDescription(suggestionText)
      .setTimestamp()
      .setFooter({ text: 'ARAB SMP - نظام الاقتراحات' });

    // إرسال الـ Embed وإضافة التفاعلات
    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react('✅');
    await sentMessage.react('❌');
  }

  // ---------------------------------------------------------
  // 2️⃣ نظام الإرسال الجماعي (DM Broadcaster)
  // ---------------------------------------------------------
  if (message.channel.id === BROADCAST_CHANNEL_ID) {
    if (!message.content.startsWith('DM ')) return;

    if (isBroadcasting) {
      return message.reply('⚠️ هناك عملية إرسال جماعي جارية حالياً، يرجى الانتظار.');
    }

    const broadcastMessage = message.content.slice(3).trim();
    if (!broadcastMessage) {
      return message.reply('❌ يرجى كتابة النص المراد إرساله بعد كلمة "DM ".');
    }

    isBroadcasting = true;
    const statusMsg = await message.reply('⏳ جاري جلب الأعضاء وبدء الإرسال الجماعي...');

    let successCount = 0;
    let failCount = 0;

    try {
      const members = await message.guild.members.fetch();
      const humanMembers = members.filter(m => !m.user.bot);

      for (const [id, member] of humanMembers) {
        try {
          await member.send(broadcastMessage);
          successCount++;
        } catch (err) {
          failCount++;
        }

        // تأخير 1.2 ثانية لتجنب الحظر (Rate Limit)
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      await statusMsg.edit(
        `✅ **اكتمل الإرسال الجماعي!**\n` +
        `🟢 **تم الإرسال بنجاح:** ${successCount}\n` +
        `🔴 **فشل الإرسال (الخاص مغلق):** ${failCount}`
      );
    } catch (error) {
      console.error('خطأ أثناء الإرسال الجماعي:', error);
      await statusMsg.edit('❌ حدث خطأ أثناء تنفيذ الإرسال الجماعي.');
    } finally {
      isBroadcasting = false;
    }
  }
});

// 🔑 حط التوكن حقك في السطر التالي بين العلامتين ''
client.login('MTUzNjQ1NzQ3NzU3MzQ0Nzc3MA.G68dOA.DzBif-rKvV1z9y0-PzMlwYdWTCB90-bRvy4Oec');