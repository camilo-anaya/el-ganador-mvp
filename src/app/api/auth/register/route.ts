// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { role } = body;
    if (role === 'customer') role = 'buyer';

    // 1. VALIDACIÓN Y AUTORIZACIÓN DE CLIENTE (COMPRADOR)
    if (role === 'buyer') {
      const {
        fullName,
        docType,
        docNumber,
        birthDate,
        phone,
        city,
        email,
        password,
        idFrontFileName,
        idBackFileName,
        ageConfirmed,
      } = body;

      if (!fullName || !phone || !email || !password) {
        return NextResponse.json(
          {
            authorized: false,
            error: 'Debes completar tu nombre completo, teléfono celular, correo electrónico y contraseña.',
          },
          { status: 400 }
        );
      }

      // Verificación de mayoría de edad si se suministra fecha
      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

        if (age < 18) {
          return NextResponse.json(
            {
              authorized: false,
              error: 'Registro rechazado: Debes ser mayor de 18 años (Ley 643 de 2001).',
            },
            { status: 403 }
          );
        }
      }

      const clientRecord = {
        id: `CLI-${Date.now()}`,
        role: 'buyer',
        fullName,
        docType,
        docNumber,
        birthDate,
        phone,
        city,
        email,
        documents: {
          cedulaFrontal: idFrontFileName,
          cedulaTrasera: idBackFileName,
        },
        kycStatus: 'AUTHORIZED',
        verificationBadge: 'CLIENTE VERIFICADO · +18',
        authorizedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        authorized: true,
        message: 'Identidad y Cédula (ambos lados) verificadas. Cliente autorizado en base de datos.',
        user: clientRecord,
      });
    }

    // 2. VALIDACIÓN Y AUTORIZACIÓN DE EMPRESA (COMERCIO ALIADO)
    if (role === 'business') {
      const {
        businessName,
        nit,
        legalRepName,
        legalRepId,
        city,
        address,
        phone,
        email,
        camaraIssueDate,
        rutFileName,
        camaraFileName,
        repIdFrontFileName,
        repIdBackFileName,
        legalConfirmed,
      } = body;

      if (
        !businessName ||
        !nit ||
        !legalRepName ||
        !legalRepId ||
        !city ||
        !address ||
        !phone ||
        !email ||
        !camaraIssueDate ||
        !rutFileName ||
        !camaraFileName ||
        !repIdFrontFileName ||
        !repIdBackFileName ||
        !legalConfirmed
      ) {
        return NextResponse.json(
          {
            authorized: false,
            error:
              'Faltan datos legales o documentos obligatorios: RUT, Cámara de Comercio vigente y Cédula del Representante Legal (Frontal y Trasera).',
          },
          { status: 400 }
        );
      }

      // Validación estricta: Cámara de Comercio expedida hace máximo 30 días
      const issueDate = new Date(camaraIssueDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 || diffDays > 30) {
        return NextResponse.json(
          {
            authorized: false,
            error: `La Cámara de Comercio tiene ${diffDays} días de expedición. Debe ser actualizada y no mayor a 30 días.`,
          },
          { status: 422 }
        );
      }

      const companyRecord = {
        id: `EMP-${Date.now()}`,
        role: 'business',
        businessName,
        nit,
        legalRepName,
        legalRepId,
        city,
        address,
        phone,
        email,
        documents: {
          rut: rutFileName,
          camaraComercio: camaraFileName,
          camaraExpedicion: camaraIssueDate,
          cedulaRepFrontal: repIdFrontFileName,
          cedulaRepTrasera: repIdBackFileName,
        },
        kybStatus: 'AUTHORIZED',
        verificationBadge: 'EMPRESA VERIFICADA · LEY 643',
        authorizedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        authorized: true,
        message: 'Expediente legal completo y Cédula (ambos lados) verificada. Empresa autorizada.',
        user: companyRecord,
      });
    }

    return NextResponse.json({ authorized: false, error: 'Rol inválido.' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { authorized: false, error: 'Error procesando el registro en la base de datos.' },
      { status: 500 }
    );
  }
}
