const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder, InteractionType } = require('discord.js');
const { token, channelId, guildId, roles, locales } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get(guildId);
    const totalMembers = guild.memberCount;

    console.log('¡El bot está en línea! / BOT Online');

    client.user.setPresence({
        activities: [{ name: `${totalMembers} miembros`, type: ActivityType.Watching }],
        status: 'dnd',
    });

    const data = new SlashCommandBuilder()
        .setName('rep')
        .setDescription(locales['es'].reviewCommand);

    await client.application.commands.set([data]);
    console.log('Comando registrado / Slash Register');
    console.log(`Bot listo! / BOT Ready / Total Members / Miembros Totales:  ${totalMembers}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const memberRoles = message.member.roles.cache;
    let lang = locales['es'];

    if (memberRoles.has(roles.englishRoleId)) {
        lang = locales['en'];
    } else if (memberRoles.has(roles.spanishRoleId)) {
        lang = locales['es'];
    }

    const palabrasClave = lang.keyword;

    if (palabrasClave.some(word => message.content.toLowerCase().includes(word))) {
        console.log(`Mensaje con palabra clave detectado: ${message.content}`);

        const embed = new EmbedBuilder()
            .setTitle(lang.reviewTitle)
            .setColor('#003aff')
            .setDescription(`${lang.reviewDescription}\n\n${lang.reviewInstructions}`)
            .addFields(
                { name: 'Comando:', value: '`/rep`', inline: true },
                { name: 'Instrucciones:', value: lang.reviewInstructions }
            )
            .setFooter({ text: `Comando solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        const boton = new ButtonBuilder()
            .setCustomId('startReview')
            .setLabel(lang.reviewCommand)
            .setStyle(ButtonStyle.Primary);

        const fila = new ActionRowBuilder().addComponents(boton);
        const sentMessage = await message.channel.send({ embeds: [embed], components: [fila] });
        await message.delete();

        setTimeout(async () => {
            try {
                await sentMessage.delete();
                console.log('El mensaje embed fue eliminado automáticamente después de 15 segundos.');
            } catch (error) {
                console.error('No se pudo eliminar el mensaje:', error);
            }
        }, 15000);
    }
});

client.on('interactionCreate', async (interaction) => {
    const memberRoles = interaction.member.roles.cache;
    let lang = locales['es'];

    if (memberRoles.has(roles.englishRoleId)) {
        lang = locales['en'];
    } else if (memberRoles.has(roles.spanishRoleId)) {
        lang = locales['es'];
    }

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'rep') {
            const embed = new EmbedBuilder()
                .setTitle(lang.formTitle)
                .setColor('#003aff')
                .setDescription('Haz clic en el botón a continuación para comenzar.');

            const boton = new ButtonBuilder()
                .setCustomId('startReview')
                .setLabel(lang.reviewCommand)
                .setStyle(ButtonStyle.Primary);

            const fila = new ActionRowBuilder().addComponents(boton);

            await interaction.reply({ embeds: [embed], components: [fila], ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId === 'startReview') {
        const modal = new ModalBuilder()
            .setCustomId('reviewModal')
            .setTitle(lang.formTitle);

        const inputProducto = new TextInputBuilder()
            .setCustomId('productInput')
            .setLabel(lang.productLabel)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputPuntuacion = new TextInputBuilder()
            .setCustomId('ratingInput')
            .setLabel(lang.ratingLabel)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputOpinion = new TextInputBuilder()
            .setCustomId('opinionInput')
            .setLabel(lang.opinionLabel)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const primeraFila = new ActionRowBuilder().addComponents(inputProducto);
        const segundaFila = new ActionRowBuilder().addComponents(inputPuntuacion);
        const terceraFila = new ActionRowBuilder().addComponents(inputOpinion);

        modal.addComponents(primeraFila, segundaFila, terceraFila);

        await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'reviewModal') {
            const producto = interaction.fields.getTextInputValue('productInput');
            const puntuacion = interaction.fields.getTextInputValue('ratingInput');
            const opinion = interaction.fields.getTextInputValue('opinionInput');

            const valorPuntuacion = parseInt(puntuacion, 10);
            if (isNaN(valorPuntuacion) || valorPuntuacion < 1 || valorPuntuacion > 5) {
                await interaction.reply({ content: lang.errorRating, ephemeral: true });
                return;
            }

            const estrellas = '⭐'.repeat(valorPuntuacion) + '☆'.repeat(5 - valorPuntuacion);
            const colorEmbed = valorPuntuacion < 3 ? '#FF0000' : '#00FF00';

            const reseñaEmbed = new EmbedBuilder()
                .setTitle('⭐ Nueva Reseña ⭐')
                .setColor(colorEmbed)
                .addFields(
                    { name: '📦 Producto', value: producto, inline: true },
                    { name: '🏆 Puntuación', value: `${estrellas} (${valorPuntuacion}/5)`, inline: true },
                    { name: '💬 Opinión', value: opinion, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Reseña recibida de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const canalReseñas = client.channels.cache.get(channelId);
            if (canalReseñas) {
                await interaction.deferReply({ ephemeral: true });
                canalReseñas.send({ embeds: [reseñaEmbed] });
                await interaction.followUp({ content: lang.reviewSent, ephemeral: true });
            } else {
                await interaction.reply({ content: lang.channelError, ephemeral: true });
            }
        }
    }
});

client.login(token);
