import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER/GMAIL_APP_PASSWORD가 설정되지 않았습니다.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"공부한입" <${process.env.GMAIL_USER}>`,
    to,
    subject: "[공부한입] 비밀번호 재설정 안내",
    // HTML만 보내면 스팸으로 분류되기 더 쉬워서 일반 텍스트 버전도 함께 보낸다.
    text: `안녕하세요, 공부한입입니다.\n\n아래 링크를 눌러 비밀번호를 재설정해주세요. 이 링크는 1시간 동안만 유효합니다.\n\n${resetUrl}\n\n본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.`,
    html: `
      <p>안녕하세요, 공부한입입니다.</p>
      <p>아래 링크를 눌러 비밀번호를 재설정해주세요. 이 링크는 1시간 동안만 유효합니다.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.</p>
    `,
  });
}
