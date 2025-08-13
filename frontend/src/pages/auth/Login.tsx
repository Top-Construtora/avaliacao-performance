import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import logo from '../../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
  
    try {
      setIsLoading(true);
      const success = await signIn(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err: any) {
      setError('Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    try {
      setIsLoading(true);
      const { resetPassword } = useAuth();
      await resetPassword(email);
      setShowForgotPassword(false);
    } catch (err) {
      setError('Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a5d47] to-[#021a14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
          {/* Logo e Título */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary-800 rounded-xl shadow-lg"
            >
              <img src={logo}/>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">
              Avaliação de Performance
            </h1>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-600">Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-800 focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Informação adicional */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Primeiro acesso? Use a senha temporária
              <br />
              enviada por email.
            </p>
          </div>
        </div>

        {/* Modal Esqueceu a Senha */}
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-naue-white rounded-2xl p-6 max-w-sm w-full shadow-md border border-naue-border-gray"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Recuperar Senha
              </h2>
              <p className="text-gray-600 mb-4">
                Digite seu email para receber as instruções de recuperação.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 mb-4 bg-white"
                placeholder="seu@email.com"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-800 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}