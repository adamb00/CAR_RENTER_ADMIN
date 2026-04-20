const CREATE_USER_URL = 'https://admin.zodiacsrentacar.com/create-new-user';

const buildCreateUserUrl = (
  name: string,
  email: string,
  slackUserId: string,
) => {
  const params = new URLSearchParams({
    name: name.trim(),
    email: email.trim(),
    slackUserId: slackUserId.trim(),
  });

  return `${CREATE_USER_URL}?${params.toString()}`;
};

export function NewUserEmail({
  name,
  email,
  slackUserId,
}: {
  name: string;
  email: string;
  slackUserId: string;
}) {
  const createUserUrl = buildCreateUserUrl(name, email, slackUserId);

  return (
    <div
      style={{
        margin: 0,
        padding: '32px 16px',
        backgroundColor: '#f4f7fb',
        fontFamily: 'Arial, sans-serif',
        color: '#023047',
      }}
    >
      <table
        role='presentation'
        cellPadding={0}
        cellSpacing={0}
        width='100%'
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          <tr>
            <td align='center'>
              <table
                role='presentation'
                cellPadding={0}
                cellSpacing={0}
                width={560}
                style={{
                  width: '100%',
                  maxWidth: 560,
                  borderCollapse: 'collapse',
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: '36px 32px' }}>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          marginBottom: 16,
                        }}
                      >
                        Meghívó új felhasználó létrehozásához
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          marginBottom: 24,
                        }}
                      >
                        Kérjük, használd az alábbi linket az új admin
                        felhasználó létrehozásához a Zodiacs Rent a Car
                        rendszerében.
                      </div>

                      <a
                        href={createUserUrl}
                        style={{
                          display: 'inline-block',
                          padding: '14px 22px',
                          backgroundColor: '#fb8500',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: 10,
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        Új felhasználó létrehozása
                      </a>

                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: '#5b7083',
                          marginTop: 24,
                        }}
                      >
                        Ha a gomb nem működik, másold be ezt a linket a
                        böngésződbe:
                        <br />
                        <a
                          href={createUserUrl}
                          style={{
                            color: '#023047',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                          }}
                        >
                          {createUserUrl}
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default NewUserEmail;
