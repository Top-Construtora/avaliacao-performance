import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Users, Target, Award } from 'lucide-react';
import logo from '../../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, loading, sessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

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
        setIsLoading(false);
      }
    } catch (err: any) {
      setError('Email ou senha inválidos');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12 scale-150"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform skew-y-12 scale-150"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 text-white">
          <div className="space-y-6">
            <img
              src={logo}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-4 tracking-wider">
                Sistema de<br />
                <span className="text-primary-300">Avaliação de</span><br />
                Performance
              </h1>
              <p className="text-xl text-white/80 leading-relaxed">
                Gerencie avaliações de desempenho, acompanhe o desenvolvimento
                da equipe e impulsione resultados com feedbacks estruturados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-primary-500 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Avaliação 360°</h3>
                <p className="text-white/70 text-sm">Autoavaliação, líder e consenso integrados</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-primary-700 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Comitê de Gente</h3>
                <p className="text-white/70 text-sm">Matriz Nine Box para gestão de talentos</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-[#baa673] rounded-xl">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PDI Integrado</h3>
                <p className="text-white/70 text-sm">Plano de desenvolvimento individual</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-6 border-0">
              {/* Logo e Título */}
              <div className="text-center space-y-4 pb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-3 bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center"
                >
                  <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
                    Bem-vindo(a)!
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Faça login para acessar o sistema
                  </p>
                </div>
              </div>

              {/* Aviso de sessão expirada */}
              {sessionExpired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Sua sessão expirou. Faça login novamente.</span>
                </motion.div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo de Email */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        error ? 'border-red-500' : 'border-gray-300'
                      } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white text-sm`}
                      placeholder="seu@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Campo de Senha */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                        error ? 'border-red-500' : 'border-gray-300'
                      } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white text-sm`}
                      placeholder="Sua senha"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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

                {/* Botão de Login */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-900 to-primary-700 hover:from-primary-800 hover:to-primary-600 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Entrar</span>
                    </>
                  )}
                </button>

                {/* Link Esqueci senha */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-gray-500 hover:text-primary-500 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Sistema protegido por autenticação segura
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
