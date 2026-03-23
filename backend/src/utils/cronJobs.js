const { Cita } = require('./models');

// Función para finalizar citas automáticamente
const finalizarCitasAutomaticamente = async () => {
  try {
    const ahora = new Date();
    const unaHoraAtras = new Date(ahora.getTime() - (60 * 60 * 1000)); // 1 hora atrás

    // Buscar citas confirmadas que ya pasaron hace más de 1 hora
    const citasPorFinalizar = await Cita.findAll({
      where: {
        estado: 'confirmada',
        fecha_hora: {
          [require('sequelize').Op.lt]: unaHoraAtras
        }
      }
    });

    if (citasPorFinalizar.length > 0) {
      console.log(`🔄 Finalizando ${citasPorFinalizar.length} citas automáticamente...`);

      for (const cita of citasPorFinalizar) {
        await cita.update({
          estado: 'finalizada',
          actualizado_en: new Date()
        });
        console.log(`✅ Cita ${cita.id} finalizada automáticamente`);
      }

      console.log('✅ Proceso de finalización automática completado');
    } else {
      console.log('ℹ️ No hay citas para finalizar automáticamente');
    }

    return citasPorFinalizar.length;

  } catch (error) {
    console.error('❌ Error en finalización automática de citas:', error);
    throw error;
  }
};

// Función para iniciar el cron job
const iniciarCronJob = () => {
  // Ejecutar cada 30 minutos
  setInterval(async () => {
    try {
      await finalizarCitasAutomaticamente();
    } catch (error) {
      console.error('Error en cron job de finalización de citas:', error);
    }
  }, 30 * 60 * 1000); // 30 minutos en milisegundos

  console.log('⏰ Cron job de finalización automática de citas iniciado (cada 30 minutos)');
};

module.exports = {
  finalizarCitasAutomaticamente,
  iniciarCronJob
};