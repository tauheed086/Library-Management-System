import { prisma } from './db';

/**
 * Generates a readable sequence-based user ID for a given role.
 * Formats:
 * - STUDENT -> stu-YYYY-NNNN
 * - FACULTY -> fac-YYYY-NNNN
 * - LIBRARIAN -> lib-YYYY-NNNN
 * - ASSISTANT_LIBRARIAN -> alib-YYYY-NNNN
 * - SUPER_ADMIN -> adm-YYYY-NNNN
 * - STAFF -> stf-YYYY-NNNN
 * 
 * @param role The member role
 * @returns A promise resolving to the generated user ID string
 */
export const generateReadableUserId = async (role: string): Promise<string> => {
  const year = new Date().getFullYear();
  let prefix = 'usr';
  
  switch (role) {
    case 'STUDENT':
      prefix = 'stu';
      break;
    case 'FACULTY':
      prefix = 'fac';
      break;
    case 'LIBRARIAN':
      prefix = 'lib';
      break;
    case 'ASSISTANT_LIBRARIAN':
      prefix = 'alib';
      break;
    case 'SUPER_ADMIN':
      prefix = 'adm';
      break;
    case 'STAFF':
      prefix = 'stf';
      break;
    default:
      prefix = role.toLowerCase().substring(0, 4);
      break;
  }

  const idPrefix = `${prefix}-${year}-`;

  // Find the last user created in the same year with the same prefix
  const lastUser = await prisma.user.findFirst({
    where: {
      id: {
        startsWith: idPrefix,
      },
    },
    orderBy: {
      id: 'desc',
    },
  });

  let nextNum = 1;
  if (lastUser) {
    const parts = lastUser.id.split('-');
    const lastNumStr = parts[parts.length - 1];
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  const paddedNum = String(nextNum).padStart(4, '0');
  return `${idPrefix}${paddedNum}`;
};
