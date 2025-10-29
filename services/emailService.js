const nodemailer = require('nodemailer');

// Configurar el transporter para Gmail (usa la configuración que te funciona)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Función para enviar confirmación de pedido
async function sendOrderConfirmation(order) {
    try {
        // Correo para el CLIENTE
        const clientMailOptions = {
            from: `"Rompopes Don Nino" <${process.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject: 'Confirmación de Pedido - Rompopes Don Nino',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff9f0d;">¡Gracias por tu pedido!</h2>
                    <p>Hola ${order.customer_name},</p>
                    <p>Tu pedido ha sido recibido y está siendo procesado.</p>
                    
                    <h3>Resumen de tu pedido:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Producto</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Precio</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
                        </tr>
                        ${order.items.map(item => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${item.price}</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                            <td style="padding: 10px; text-align: right;">$${order.subtotal}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Envío:</td>
                            <td style="padding: 10px; text-align: right;">$${order.shipping}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold;">$${order.total}</td>
                        </tr>
                    </table>
                    
                    <h3>Información de envío:</h3>
                    <p>${order.customer_name}<br>
                    ${order.customer_address}<br>
                    ${order.customer_city}<br>
                    ${order.customer_phone || 'Teléfono no proporcionado'}</p>
                    
                    <p>Método de pago: ${order.payment_method}</p>
                    
                    <p>Te contactaremos pronto para coordinar la entrega.</p>
                    
                    <p>Saludos,<br>El equipo de Rompopes Don Nino</p>
                </div>
            `
        };

        // Correo para el DUEÑO (nuevo)
        const ownerMailOptions = {
            from: `"Sistema de Pedidos" <${process.env.EMAIL_USER}>`,
            to: 'robml2734@gmail.com', // Tu correo como dueño
            subject: `Nuevo Pedido #${order.id} - ${order.customer_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff9f0d;">¡Nuevo pedido recibido!</h2>
                    <p>Se ha realizado un nuevo pedido en tu tienda de rompopes.</p>
                    
                    <h3>Información del cliente:</h3>
                    <p><strong>Nombre:</strong> ${order.customer_name}</p>
                    <p><strong>Email:</strong> ${order.customer_email}</p>
                    <p><strong>Teléfono:</strong> ${order.customer_phone}</p>
                    <p><strong>Dirección:</strong> ${order.customer_address}, ${order.customer_city}</p>
                    <p><strong>Código postal:</strong> ${order.customer_postal_code}</p>
                    
                    <h3>Detalles del pedido:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Producto</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Precio</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
                        </tr>
                        ${order.items.map(item => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${item.price}</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                            <td style="padding: 10px; text-align: right;">$${order.subtotal}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Envío:</td>
                            <td style="padding: 10px; text-align: right;">$${order.shipping}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold;">$${order.total}</td>
                        </tr>
                    </table>
                    
                    <p><strong>Método de pago:</strong> ${order.payment_method}</p>
                    <p><strong>Fecha del pedido:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    
                    <p>Revisa tu panel de administración para más detalles.</p>
                    
                    <p>Saludos,<br>Tu sistema de Rompopes Don Nino</p>
                </div>
            `
        };

        // Enviar ambos correos
        await transporter.sendMail(clientMailOptions);
        console.log('Email de confirmación enviado al cliente:', order.customer_email);

        await transporter.sendMail(ownerMailOptions);
        console.log('Email de notificación enviado al dueño: robml2734@gmail.com');

    } catch (error) {
        console.error('Error enviando email:', error);
    }
}

// Función para enviar actualización de estado
async function sendStatusUpdate(order, oldStatus, newStatus) {
    try {
        const statusMessages = {
            'processing': 'tu pedido está siendo procesado',
            'shipped': 'tu pedido ha sido enviado',
            'delivered': 'tu pedido ha sido entregado',
            'cancelled': 'tu pedido ha sido cancelado'
        };

        if (!statusMessages[newStatus]) return;

        const mailOptions = {
            from: `"Rompopes Don Nino" <${process.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject: 'Actualización de tu pedido - Rompopes Don Nino',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff9f0d;">Actualización de pedido</h2>
                    <p>Hola ${order.customer_name},</p>
                    <p>Queremos informarte que ${statusMessages[newStatus]}.</p>
                    
                    <p><strong>Estado anterior:</strong> ${oldStatus}</p>
                    <p><strong>Nuevo estado:</strong> ${newStatus}</p>
                    
                    ${newStatus === 'shipped' ? `
                        <p>Tu pedido está en camino. Por favor, asegúrate de que alguien esté disponible para recibirlo.</p>
                    ` : ''}
                    
                    ${newStatus === 'delivered' ? `
                        <p>¡Esperamos que disfrutes tus productos! Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    ` : ''}
                    
                    ${newStatus === 'cancelled' ? `
                        <p>Lamentamos informarte que tu pedido ha sido cancelado. Si crees que esto es un error, por favor contactanos.</p>
                    ` : ''}
                    
                    <p>Saludos,<br>El equipo de Rompopes Don Nino</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email de actualización enviado a:', order.customer_email);
    } catch (error) {
        console.error('Error enviando email de actualización:', error);
    }
}


// Función para enviar una notificación de mensaje de contacto
async function sendContactNotification(nombre, email, mensaje) {
    try {
        const mailOptions = {
            from: `"Notificaciones Don Nino" <${process.env.EMAIL_USER}>`,
            to: 'robml2734@gmail.com', // El correo del dueño de la página
            subject: '¡Nuevo Mensaje de Contacto! De tienda Don Nino',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #ff9f0d;">Has recibido un nuevo mensaje de contacto</h2>
                    <p>¡Alguien te ha escrito desde la página de Rompopes y Cremas Don Nino!</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Nombre:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${nombre}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">Mensaje:</td>
                            <td style="padding: 10px;">${mensaje}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; font-style: italic; color: #777;">Este es un mensaje automático. No es necesario responder a este correo.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Correo de notificación de contacto enviado a robml2734@gmail.com');

    } catch (error) {
        console.error('Error enviando email de notificación de contacto:', error);
    }
}

// Agregar esta función al final de tu emailService.js
async function sendNewsletterNotification(email) {
    try {
        const mailOptions = {
            from: `"Newsletter Don Nino" <${process.env.EMAIL_USER}>`,
            to: 'robml2734@gmail.com', // Tu correo como dueño
            subject: '¡Nuevo Suscriptor al Newsletter!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #ff9f0d;">¡Nuevo suscriptor al newsletter!</h2>
                    <p>Alguien se ha suscrito al newsletter de Rompopes y Cremas Don Nino.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Email:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">Fecha:</td>
                            <td style="padding: 10px;">${new Date().toLocaleString('es-ES')}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px; font-style: italic; color: #777;">
                        Este suscriptor recibirá actualizaciones sobre nuevos productos y promociones.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Notificación de newsletter enviada a robml2734@gmail.com');

    } catch (error) {
        console.error('Error enviando email de newsletter:', error);
    }
}

// NO OLVIDES AGREGARLA AL module.exports:
module.exports = { 
    sendOrderConfirmation, 
    sendStatusUpdate, 
    sendContactNotification,
    sendNewsletterNotification  // ← Agregar esta línea
};

//module.exports = { sendOrderConfirmation, sendStatusUpdate, sendContactNotification };