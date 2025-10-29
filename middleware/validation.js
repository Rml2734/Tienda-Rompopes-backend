// middleware/validation.js
const validateOrder = (req, res, next) => {
  const {
    customer_name,
    customer_email,
    items,
    total
  } = req.body;

  if (!customer_name || customer_name.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  if (!customer_email || !/^\S+@\S+\.\S+$/.test(customer_email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe contener items' });
  }

  if (!total || isNaN(total) || total <= 0) {
    return res.status(400).json({ error: 'Total inválido' });
  }

  next();
};

module.exports = { validateOrder };